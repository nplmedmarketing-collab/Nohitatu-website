<%@ Page Language="C#" EnableSessionState="False" ValidateRequest="False" %>
<%@ Import Namespace="System" %>
<%@ Import Namespace="System.IO" %>
<%@ Import Namespace="System.Text" %>
<%@ Import Namespace="System.Web" %>
<%@ Import Namespace="System.Net" %>
<script runat="server">
void Page_Load(object sender, EventArgs e)
{
    Response.ContentType = "application/json; charset=utf-8";
    try
    {
        string body = new StreamReader(Request.InputStream, Encoding.UTF8).ReadToEnd();
        if (body == null) body = "";

        string name = GetField(body, "name");
        string email = GetField(body, "email");
        string message = GetField(body, "message");
        string token = GetField(body, "recaptcha" + "Token");
        if (name == "" || email == "" || message == "")
        {
            Response.StatusCode = 400;
            Response.Write("{\"success\":false,\"error\":\"Name, email, and message are required\"}");
            return;
        }
        if (token == "")
        {
            Response.StatusCode = 400;
            Response.Write("{\"success\":false,\"error\":\"Missing captcha token\"}");
            return;
        }

        string secretPath = Server.MapPath("recaptcha-secret.config");
        string secret = File.Exists(secretPath) ? File.ReadAllText(secretPath).Trim() : "";
        if (secret == "")
        {
            Response.StatusCode = 503;
            Response.Write("{\"success\":false,\"error\":\"Secret missing\"}");
            return;
        }

        string adminPath = Server.MapPath("admin-api.config");
        string adminUrl = File.Exists(adminPath) ? File.ReadAllText(adminPath).Trim() : "";
        if (adminUrl == "")
        {
            Response.StatusCode = 503;
            Response.Write("{\"success\":false,\"error\":\"Admin API config missing\"}");
            return;
        }

        try { ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072; } catch (Exception) {}

        // Verify with Google
        string googleUrl = File.Exists(Server.MapPath("captcha-api.config"))
            ? File.ReadAllText(Server.MapPath("captcha-api.config")).Trim()
            : "";
        if (googleUrl == "")
        {
            Response.StatusCode = 503;
            Response.Write("{\"success\":false,\"error\":\"Captcha API config missing\"}");
            return;
        }

        string verifyBody = "secret=" + HttpUtility.UrlEncode(secret) + "&response=" + HttpUtility.UrlEncode(token);
        WebClient wc = new WebClient();
        wc.Headers["Content-Type"] = "application/x-www-form-urlencoded";
        string verifyJson = Encoding.UTF8.GetString(wc.UploadData(googleUrl, "POST", Encoding.UTF8.GetBytes(verifyBody)));
        wc.Dispose();
        if (verifyJson.IndexOf("\"success\":true") < 0 && verifyJson.IndexOf("\"success\": true") < 0)
        {
            Response.StatusCode = 400;
            Response.Write("{\"success\":false,\"error\":\"Please complete the reCAPTCHA and try again.\"}");
            return;
        }

        string payload = "{"
            + "\"name\":\"" + Q(name) + "\","
            + "\"email\":\"" + Q(email) + "\","
            + "\"message\":\"" + Q(message) + "\","
            + "\"phone\":\"" + Q(GetField(body, "phone")) + "\","
            + "\"company\":\"" + Q(GetField(body, "company")) + "\","
            + "\"country\":\"" + Q(GetField(body, "country")) + "\","
            + "\"inquiry_type\":\"" + Q(GetField(body, "inquiry_type")) + "\","
            + "\"interest\":\"" + Q(GetField(body, "interest")) + "\","
            + "\"recipient\":\"" + Q(GetField(body, "recipient")) + "\""
            + "}";

        WebClient client = new WebClient();
        client.Headers["Content-Type"] = "application/json; charset=utf-8";
        client.Encoding = Encoding.UTF8;
        byte[] result = client.UploadData(adminUrl, "POST", Encoding.UTF8.GetBytes(payload));
        client.Dispose();
        Response.Write(Encoding.UTF8.GetString(result));
    }
    catch (Exception ex)
    {
        Response.StatusCode = 500;
        Response.Write("{\"success\":false,\"error\":\"Server error\",\"detail\":\"" + Q(ex.Message) + "\"}");
    }
}

string GetField(string json, string key)
{
    string needle = "\"" + key + "\":\"";
    int start = json.IndexOf(needle);
    if (start < 0) return "";
    start = start + needle.Length;
    int end = json.IndexOf("\"", start);
    if (end < 0) return "";
    return json.Substring(start, end - start);
}

string Q(string v)
{
    if (v == null) return "";
    return v.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\r", " ").Replace("\n", " ");
}
</script>
