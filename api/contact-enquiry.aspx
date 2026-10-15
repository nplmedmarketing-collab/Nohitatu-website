<%@ Page Language="C#" EnableSessionState="False" ValidateRequest="False" %>
<%@ Import Namespace="System" %>
<%@ Import Namespace="System.IO" %>
<%@ Import Namespace="System.Text" %>
<%@ Import Namespace="System.Text.RegularExpressions" %>
<%@ Import Namespace="System.Web" %>
<%@ Import Namespace="System.Net" %>
<script runat="server">
void Page_Load(object sender, EventArgs e)
{
    Response.ContentType = "application/json; charset=utf-8";
    try
    {
        if (Request.HttpMethod != "POST")
        {
            Response.StatusCode = 405;
            Response.Write("{\"success\":false,\"error\":\"Method not allowed\"}");
            return;
        }

        string body = new StreamReader(Request.InputStream, Encoding.UTF8).ReadToEnd();
        if (body == null) body = "";

        string name = GetVal(body, "name");
        string email = GetVal(body, "email");
        string message = GetVal(body, "message");
        string token = GetVal(body, "recaptchaToken");
        string phone = GetVal(body, "phone");
        string company = GetVal(body, "company");
        string country = GetVal(body, "country");
        string inquiryType = GetVal(body, "inquiry_type");
        string interest = GetVal(body, "interest");
        string recipient = GetVal(body, "recipient");

        if (name.Length == 0 || email.Length == 0 || message.Length == 0)
        {
            Response.StatusCode = 400;
            Response.Write("{\"success\":false,\"error\":\"Name, email, and message are required\"}");
            return;
        }

        string secretPath = Server.MapPath("recaptcha-secret.config");
        if (!File.Exists(secretPath))
        {
            Response.StatusCode = 503;
            Response.Write("{\"success\":false,\"error\":\"reCAPTCHA secret file missing\"}");
            return;
        }
        string secret = File.ReadAllText(secretPath).Trim();
        if (secret.Length == 0)
        {
            Response.StatusCode = 503;
            Response.Write("{\"success\":false,\"error\":\"reCAPTCHA secret empty\"}");
            return;
        }
        if (token.Length == 0)
        {
            Response.StatusCode = 400;
            Response.Write("{\"success\":false,\"error\":\"Please complete the reCAPTCHA and try again.\"}");
            return;
        }

        // Force TLS 1.2 on older .NET
        try { ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072; } catch {}

        string verifyBody = "secret=" + HttpUtility.UrlEncode(secret) + "&response=" + HttpUtility.UrlEncode(token);
        string verifyJson = "";
        WebClient wc = new WebClient();
        wc.Headers["Content-Type"] = "application/x-www-form-urlencoded";
        byte[] verifyBytes = wc.UploadData("https://www.google.com/recaptcha/api/siteverify", "POST", Encoding.UTF8.GetBytes(verifyBody));
        verifyJson = Encoding.UTF8.GetString(verifyBytes);
        wc.Dispose();

        if (verifyJson.IndexOf("\"success\":true") < 0 && verifyJson.IndexOf("\"success\": true") < 0)
        {
            Response.StatusCode = 400;
            Response.Write("{\"success\":false,\"error\":\"Please complete the reCAPTCHA and try again.\"}");
            return;
        }

        Match sm = Regex.Match(verifyJson, "\"score\"\\s*:\\s*([0-9\\.]+)");
        if (sm.Success)
        {
            double score = 1;
            double.TryParse(sm.Groups[1].Value, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out score);
            if (score < 0.5)
            {
                Response.StatusCode = 400;
                Response.Write("{\"success\":false,\"error\":\"Please complete the reCAPTCHA and try again.\"}");
                return;
            }
        }

        StringBuilder sb = new StringBuilder();
        sb.Append("{\"name\":\"").Append(Esc(name)).Append("\",");
        sb.Append("\"email\":\"").Append(Esc(email)).Append("\",");
        sb.Append("\"phone\":\"").Append(Esc(phone)).Append("\",");
        sb.Append("\"company\":\"").Append(Esc(company)).Append("\",");
        sb.Append("\"country\":\"").Append(Esc(country)).Append("\",");
        sb.Append("\"inquiry_type\":\"").Append(Esc(inquiryType)).Append("\",");
        sb.Append("\"interest\":\"").Append(Esc(interest)).Append("\",");
        sb.Append("\"message\":\"").Append(Esc(message)).Append("\",");
        sb.Append("\"recipient\":\"").Append(Esc(recipient)).Append("\"}");

        WebClient wc2 = new WebClient();
        wc2.Headers["Content-Type"] = "application/json; charset=utf-8";
        wc2.Encoding = Encoding.UTF8;
        string upstream = wc2.UploadString("https://nohitatu-website-admin.onrender.com/api/contact-enquiry", "POST", sb.ToString());
        wc2.Dispose();

        Response.StatusCode = 201;
        if (upstream == null || upstream.Length == 0) Response.Write("{\"success\":true}");
        else Response.Write(upstream);
    }
    catch (Exception ex)
    {
        Response.StatusCode = 500;
        Response.Write("{\"success\":false,\"error\":\"Server error\",\"detail\":\"" + Esc(ex.Message) + "\"}");
    }
}

string GetVal(string json, string key)
{
    string formVal = Request.Form[key];
    if (formVal != null && formVal.Trim().Length > 0) return formVal.Trim();
    if (json == null || json.Length == 0) return "";
    Match m = Regex.Match(json, "\"" + key + "\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"");
    if (!m.Success) return "";
    return m.Groups[1].Value.Replace("\\\"", "\"").Replace("\\\\", "\\").Trim();
}

string Esc(string v)
{
    if (v == null) return "";
    return v.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\r", " ").Replace("\n", " ");
}
</script>
