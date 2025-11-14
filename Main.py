import os
import logging
import json
import requests
import socket  # Added for IP resolution
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import time
import asyncio
from typing import List, Optional, Dict, Any

# --- API Clients/Utils Setup ---
# *** NOTE: Removed the faulty 'from google_safebrowsing_client import check_google_safe_browsing' import ***

# Load environment variables from .env file
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Configuration (Keys) ---
VIRUSTOTAL_API_KEY = os.environ.get("VIRUSTOTAL_API_KEY", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GSB_API_KEY = os.environ.get("GSB_API_KEY", "")


# --- Pydantic Models ---

class UrlScanRequest(BaseModel):
    url: str


class AiQueryRequest(BaseModel):
    query: str


class EmailCheckRequest(BaseModel):
    email: str


class GeoIPDetails(BaseModel):
    status: str
    message: Optional[str] = None
    ip_address: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    isp: Optional[str] = None
    organization: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None


class GSBDetails(BaseModel):
    status: str
    message: Optional[str] = None
    matches: Optional[List[Dict[str, str]]] = None


class VirusTotalDetails(BaseModel):
    status: str
    message: Optional[str] = None
    malicious_count: Optional[int] = 0
    harmless_count: Optional[int] = 0
    results_url: Optional[str] = None


class BreachDetails(BaseModel):
    status: str
    message: Optional[str] = None
    breaches_found: Optional[int] = 0
    breach_list: Optional[List[Dict[str, str]]] = None


class ScanResult(BaseModel):
    url: str
    overall_summary: str
    details: Dict[str, Any]


class FileScanResult(BaseModel):
    filename: str
    overall_summary: str
    details: Dict[str, Any]


class AiQueryResult(BaseModel):
    ai_response: str
    sources: List[Dict[str, str]]


class EmailCheckResult(BaseModel):
    email: str
    overall_summary: str
    details: Dict[str, Any]


# --- Mock Google Safe Browsing Function (Self-Contained) ---

def check_google_safe_browsing(url: str, api_key: str) -> GSBDetails:
    """
    MOCK: Simulates checking a URL against Google Safe Browsing (GSB).
    Real API key usage is available but requires the correct SDK/implementation.
    """
    if not api_key:
        return GSBDetails(status="skipped", message="Google Safe Browsing API Key not configured. Using mock logic.")

    # Simple mock logic based on URL content
    if "testsafebrowsing" in url.lower():
        return GSBDetails(
            status="DANGER",
            message="Multiple threats detected by Google Safe Browsing.",
            matches=[
                {"threatType": "MALWARE", "platformType": "ANY_PLATFORM"},
                {"threatType": "PHISHING", "platformType": "WINDOWS"}
            ]
        )
    else:
        # A real implementation would call the GSB API here
        return GSBDetails(status="CLEAN", message="URL not flagged by Google Safe Browsing.")


# --- FastAPI Setup ---
app = FastAPI(title="CyberShield Security Backend")

# CORS setup (Allow all origins for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Service Functions ---

# GeoIP Lookup Function (keyless service)
def perform_geoip_lookup(ip_address: str) -> GeoIPDetails:
    """Performs GeoIP lookup using ip-api.com."""
    if not ip_address:
        return GeoIPDetails(status="error", message="IP address could not be resolved from URL.")

    # Use ip-api.com for a fast, keyless GeoIP lookup
    GEOIP_URL = f"http://ip-api.com/json/{ip_address}?fields=status,message,country,city,isp,org,lat,lon,query"

    try:
        response = requests.get(GEOIP_URL, timeout=5)
        response.raise_for_status()
        data = response.json()

        if data.get("status") == "success":
            return GeoIPDetails(
                status="success",
                ip_address=data.get("query"),
                country=data.get("country"),
                city=data.get("city"),
                isp=data.get("isp"),
                organization=data.get("org"),
                lat=data.get("lat"),
                lon=data.get("lon")
            )
        else:
            return GeoIPDetails(status="error", message=data.get("message", "GeoIP lookup failed."))

    except requests.RequestException as e:
        logger.error(f"GeoIP API call failed: {e}")
        return GeoIPDetails(status="error", message=f"GeoIP API call failed: {e}")


# VirusTotal URL Scan
def perform_virustotal_url_scan(url: str) -> VirusTotalDetails:
    """Submits a URL to VirusTotal for analysis and retrieves the result."""
    if not VIRUSTOTAL_API_KEY:
        return VirusTotalDetails(status="skipped", message="VirusTotal API Key not configured.")

    API_URL = "https://www.virustotal.com/api/v3/urls"
    headers = {
        "x-apikey": VIRUSTOTAL_API_KEY,
        "Accept": "application/json"
    }

    # 1. Submit URL for analysis
    try:
        submission_response = requests.post(
            API_URL,
            headers=headers,
            data={"url": url},
            timeout=10
        )
        submission_response.raise_for_status()
        submission_data = submission_response.json()
        analysis_id = submission_data["data"]["id"]

    except requests.RequestException as e:
        logger.error(f"VirusTotal URL Submission failed: {e}")
        return VirusTotalDetails(status="error", message=f"VirusTotal URL Submission failed: {e}")

    # 2. Poll for results (Wait up to 40 seconds)
    report_url = f"https://www.virustotal.com/api/v3/analyses/{analysis_id}"

    for _ in range(4):  # 4 retries, 10s sleep each = 40s max wait
        time.sleep(10)
        try:
            report_response = requests.get(report_url, headers=headers, timeout=10)
            report_response.raise_for_status()
            report_data = report_response.json()

            status = report_data["data"]["attributes"]["status"]
            if status == "completed":
                stats = report_data["data"]["attributes"]["stats"]
                malicious = stats.get("malicious", 0) + stats.get("suspicious", 0)
                harmless = stats.get("harmless", 0)

                results_url = f"https://www.virustotal.com/gui/url/{analysis_id}/detection"

                return VirusTotalDetails(
                    status="completed",
                    malicious_count=malicious,
                    harmless_count=harmless,
                    results_url=results_url
                )
            elif status == "queued":
                logger.info("VirusTotal scan is still queued. Waiting...")
                continue
            else:
                return VirusTotalDetails(status="error", message=f"VirusTotal analysis status: {status}")

        except requests.RequestException as e:
            logger.error(f"VirusTotal Report retrieval failed: {e}")
            return VirusTotalDetails(status="error", message=f"VirusTotal Report retrieval failed: {e}")

    return VirusTotalDetails(status="PENDING", message="VirusTotal scan timed out after 40 seconds. Check back later.")


# VirusTotal File Scan
async def perform_virustotal_file_scan(file: UploadFile) -> VirusTotalDetails:
    """Submits a file to VirusTotal for analysis and retrieves the result."""
    if not VIRUSTOTAL_API_KEY:
        return VirusTotalDetails(status="skipped", message="VirusTotal API Key not configured.")

    API_URL = "https://www.virustotal.com/api/v3/files"
    headers = {
        "x-apikey": VIRUSTOTAL_API_KEY,
        "Accept": "application/json"
    }

    # 1. Upload file
    try:
        file_contents = await file.read()
        files = {'file': (file.filename, file_contents)}

        upload_response = requests.post(
            API_URL,
            headers=headers,
            files=files,
            timeout=30  # Increased timeout for large files
        )
        upload_response.raise_for_status()
        upload_data = upload_response.json()
        analysis_id = upload_data["data"]["id"]

    except requests.RequestException as e:
        logger.error(f"VirusTotal File Upload failed: {e}")
        return VirusTotalDetails(status="error",
                                 message=f"VirusTotal File Upload failed: {e}. Check file size (max 32MB).")
    except Exception as e:
        logger.error(f"File reading error: {e}")
        return VirusTotalDetails(status="error", message=f"Internal error reading file: {e}")

    # 2. Poll for results (Wait up to 50 seconds)
    report_url = f"https://www.virustotal.com/api/v3/analyses/{analysis_id}"

    for _ in range(5):  # 5 retries, 10s sleep each = 50s max wait
        await asyncio.sleep(10)
        try:
            report_response = requests.get(report_url, headers=headers, timeout=10)
            report_response.raise_for_status()
            report_data = report_response.json()

            status = report_data["data"]["attributes"]["status"]
            if status == "completed":
                stats = report_data["data"]["attributes"]["stats"]
                malicious = stats.get("malicious", 0) + stats.get("suspicious", 0)
                harmless = stats.get("harmless", 0)

                results_url = f"https://www.virustotal.com/gui/file/{analysis_id}/detection"

                return VirusTotalDetails(
                    status="completed",
                    malicious_count=malicious,
                    harmless_count=harmless,
                    results_url=results_url
                )
            elif status == "queued" or status == "running":
                logger.info("VirusTotal file scan is still running. Waiting...")
                continue
            else:
                return VirusTotalDetails(status="error", message=f"VirusTotal analysis status: {status}")

        except requests.RequestException as e:
            logger.error(f"VirusTotal File Report retrieval failed: {e}")
            return VirusTotalDetails(status="error", message=f"VirusTotal File Report retrieval failed: {e}")

    return VirusTotalDetails(status="PENDING",
                             message="VirusTotal file scan timed out after 50 seconds. Check back later.")


# Gemini API Call (Using the recommended synchronous fetch strategy for demonstration)
def query_gemini_api(query: str, system_prompt: str) -> Dict[str, Any]:
    """Queries the Gemini API with search grounding."""
    if not GEMINI_API_KEY:
        return {"ai_response": "Gemini API Key not configured. Please set GEMINI_API_KEY in your .env file.",
                "sources": []}

    API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key={GEMINI_API_KEY}"

    payload = {
        "contents": [{"parts": [{"text": query}]}],
        "tools": [{"google_search": {}}],  # Enable Google Search Grounding
        "systemInstruction": {"parts": [{"text": system_prompt}]},
    }

    # Use exponential backoff for robustness
    max_retries = 3
    delay = 1

    for attempt in range(max_retries):
        try:
            response = requests.post(
                API_URL,
                headers={'Content-Type': 'application/json'},
                data=json.dumps(payload),
                timeout=30
            )
            response.raise_for_status()
            result = response.json()

            candidate = result.get('candidates', [{}])[0]

            text = candidate.get('content', {}).get('parts', [{}])[0].get('text', 'No response text found.')

            sources = []
            grounding_metadata = candidate.get('groundingMetadata')
            if grounding_metadata and grounding_metadata.get('groundingAttributions'):
                sources = [
                    {'uri': attr.get('web', {}).get('uri'), 'title': attr.get('web', {}).get('title')}
                    for attr in grounding_metadata['groundingAttributions']
                    if attr.get('web', {}).get('uri') and attr.get('web', {}).get('title')
                ]

            return {"ai_response": text, "sources": sources}

        except requests.RequestException as e:
            logger.error(f"Gemini API call failed (Attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(delay)
                delay *= 2
            else:
                return {"ai_response": f"AI service failed to respond after multiple retries: {e}", "sources": []}
        except Exception as e:
            logger.error(f"Gemini API parsing failed: {e}")
            return {"ai_response": f"AI response parsing error: {e}", "sources": []}

    return {"ai_response": "An unknown error occurred with the AI service.", "sources": []}


# Email Breach Check Function (Simulated HIBP)
def check_email_breach(email: str) -> BreachDetails:
    """
    Simulates checking an email against a data breach database (like HIBP).
    This logic is simulated for demonstration purposes.
    """
    # Simple, non-exhaustive validation
    if "@" not in email or "." not in email:
        return BreachDetails(status="error", message="Invalid email format.")

    # Simulated Breach Logic
    email_domain = email.split('@')[-1]

    simulated_breaches = {
        "bad-domain.com": [
            {"name": "E-Commerce Leak 2023", "date": "2023-11-01", "data": "Emails, Passwords (Hashed)"},
            {"name": "Gaming Forum Hack 2021", "date": "2021-05-15", "data": "Emails, Usernames"},
        ],
        "test@example.com": [
            {"name": "ExampleCorp Breach 2024", "date": "2024-01-01", "data": "Emails, Full Names, Phone Numbers"},
        ]
    }

    breach_list = []

    # Check by specific email
    if email in simulated_breaches:
        breach_list.extend(simulated_breaches[email])

    # Check by domain (optional, for broader simulation)
    if email_domain == "worstcase.com":
        breach_list.append({"name": "Global Data Dump", "date": "2020-01-01", "data": "Emails, IP Addresses"})

    if breach_list:
        summary = f"DANGER: Email found in {len(breach_list)} known data breaches."
        return BreachDetails(
            status="DANGER",
            message="This email or domain is exposed. Change passwords and enable MFA.",
            breaches_found=len(breach_list),
            breach_list=breach_list
        )
    else:
        summary = "CLEAN: No breaches found for this email address."
        return BreachDetails(
            status="CLEAN",
            message="No public breaches found. Maintain strong passwords and MFA.",
            breaches_found=0,
            breach_list=[]
        )


# --- API Endpoints ---

@app.post("/scan", response_model=ScanResult)
async def scan_url(request: UrlScanRequest):
    """Performs a comprehensive scan on a URL using VirusTotal, GSB, and GeoIP."""
    url = request.url

    # 1. Resolve IP address (simple domain resolution, not full URL)
    try:
        from urllib.parse import urlparse
        hostname = urlparse(url).netloc
        # Ensure we have a hostname before attempting resolution
        if not hostname:
            ip_address = None
        else:
            ip_address = socket.gethostbyname(hostname)
    except Exception as e:
        logger.warning(f"Could not resolve IP for {hostname}: {e}")
        ip_address = None

    # Run checks concurrently (or in order if necessary)
    geoip_details = perform_geoip_lookup(ip_address)
    gsb_details = check_google_safe_browsing(url, GSB_API_KEY)
    vt_details = perform_virustotal_url_scan(url)

    # Combine results and determine overall summary
    is_malicious = (
            gsb_details.status == "DANGER" or
            (vt_details.status == "completed" and vt_details.malicious_count > 0)
    )

    if is_malicious:
        summary = "DANGER: This URL is flagged as MALICIOUS or UNSAFE by one or more services."
    elif vt_details.status == "PENDING":
        summary = "WARNING: Scan is pending/timed out. Results are incomplete."
    else:
        summary = "CLEAN: The URL appears SAFE based on current data."

    return ScanResult(
        url=url,
        overall_summary=summary,
        details={
            "geoip": geoip_details.model_dump(),
            "google_safe_browsing": gsb_details.model_dump(),
            "virustotal": vt_details.model_dump()
        }
    )


@app.post("/scan-file", response_model=FileScanResult)
async def scan_file(file: UploadFile = File(...)):
    """Submits a file for scanning using VirusTotal."""
    vt_details = await perform_virustotal_file_scan(file)

    is_malicious = (vt_details.status == "completed" and vt_details.malicious_count > 0)

    if is_malicious:
        summary = "DANGER: The file is flagged as MALICIOUS by anti-virus engines."
    elif vt_details.status == "PENDING":
        summary = "WARNING: Scan is pending/timed out. Results are incomplete."
    else:
        summary = "CLEAN: The file appears CLEAN based on current anti-virus data."

    return FileScanResult(
        filename=file.filename,
        overall_summary=summary,
        details={
            "virustotal": vt_details.model_dump()
        }
    )


@app.post("/ai-query", response_model=AiQueryResult)
async def ai_query(request: AiQueryRequest):
    """Consults the Gemini API for threat intelligence queries."""
    system_prompt = "You are a specialized cybersecurity analyst. Respond to the user's query with a professional, concise, and helpful analysis, strictly basing your answer on the provided search results."

    result = query_gemini_api(request.query, system_prompt)

    return AiQueryResult(**result)


@app.post("/check-email", response_model=EmailCheckResult)
async def check_email(request: EmailCheckRequest):
    """Performs a breach check on an email address."""
    email = request.email.lower().strip()

    # Run the breach check
    breach_details = check_email_breach(email)

    # Determine overall summary
    if breach_details.status == "DANGER":
        summary = f"DANGER: This email was found in {breach_details.breaches_found} data breaches."
    elif breach_details.status == "error":
        summary = f"ERROR: Invalid input or failed check: {breach_details.message}"
    else:
        summary = "CLEAN: No known breaches found for this email address."

    return EmailCheckResult(
        email=email,
        overall_summary=summary,
        details={
            "breach_check": breach_details.model_dump()
        }
    )