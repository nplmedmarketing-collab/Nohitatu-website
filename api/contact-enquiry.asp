<%@ Language="VBScript" %>
<%
Response.ContentType = "application/json; charset=utf-8"
Response.CacheControl = "no-cache"
Response.AddHeader "Pragma", "no-cache"
On Error Resume Next

Const RENDER_URL = "https://nohitatu-website-admin.onrender.com/api/contact-enquiry"
Const EXPECTED_ACTION = "contact"
Const MIN_SCORE = 0.5

If UCase(Request.ServerVariables("REQUEST_METHOD")) <> "POST" Then
  Response.Status = "405 Method Not Allowed"
  Response.Write "{""success"":false,""error"":""Method not allowed""}"
  Response.End
End If

Dim name, email, phone, company, country, inquiryType, interest, message, recipient, token
name = Trim(Request.Form("name"))
email = Trim(Request.Form("email"))
phone = Trim(Request.Form("phone"))
company = Trim(Request.Form("company"))
country = Trim(Request.Form("country"))
inquiryType = Trim(Request.Form("inquiry_type"))
interest = Trim(Request.Form("interest"))
message = Trim(Request.Form("message"))
recipient = Trim(Request.Form("recipient"))
token = Trim(Request.Form("recaptchaToken"))
If token = "" Then token = Trim(Request.Form("g-recaptcha-response"))

If name = "" Or email = "" Or message = "" Then
  Response.Status = "400 Bad Request"
  Response.Write "{""success"":false,""error"":""Name, email, and message are required""}"
  Response.End
End If

Dim secret
secret = ReadSecret()
If secret = "" Then
  Response.Status = "503 Service Unavailable"
  Response.Write "{""success"":false,""error"":""reCAPTCHA is not configured on the server""}"
  Response.End
End If

Dim captchaOk, captchaErr
captchaOk = VerifyRecaptcha(secret, token, Request.ServerVariables("REMOTE_ADDR"), captchaErr)
If Not captchaOk Then
  Response.Status = "400 Bad Request"
  Response.Write "{""success"":false,""error"":""Please complete the reCAPTCHA and try again."",""code"":""" & JsonEscape(captchaErr) & """}"
  Response.End
End If

Dim payload
payload = "{" & _
  """name"":""" & JsonEscape(name) & """," & _
  """email"":""" & JsonEscape(email) & """," & _
  """phone"":""" & JsonEscape(phone) & """," & _
  """company"":""" & JsonEscape(company) & """," & _
  """country"":""" & JsonEscape(country) & """," & _
  """inquiry_type"":""" & JsonEscape(inquiryType) & """," & _
  """interest"":""" & JsonEscape(interest) & """," & _
  """message"":""" & JsonEscape(message) & """," & _
  """recipient"":""" & JsonEscape(recipient) & """" & _
"}"

Dim http, status, respText
Set http = Server.CreateObject("MSXML2.ServerXMLHTTP.6.0")
If Err.Number <> 0 Then
  Err.Clear
  Set http = Server.CreateObject("MSXML2.ServerXMLHTTP")
End If
If Err.Number <> 0 Then
  Response.Status = "500 Internal Server Error"
  Response.Write "{""success"":false,""error"":""HTTP client unavailable on host""}"
  Response.End
End If

http.setTimeouts 10000, 10000, 30000, 60000
http.Open "POST", RENDER_URL, False
http.setRequestHeader "Content-Type", "application/json; charset=utf-8"
http.setRequestHeader "Accept", "application/json"
http.Send payload

If Err.Number <> 0 Then
  Response.Status = "502 Bad Gateway"
  Response.Write "{""success"":false,""error"":""Could not reach enquiry service. Please try again.""}"
  Response.End
End If

status = http.status
respText = http.responseText
If respText = "" Then
  If status >= 200 And status < 300 Then
    respText = "{""success"":true}"
  Else
    respText = "{""success"":false,""error"":""Upstream error""}"
  End If
End If

Response.Status = CStr(status)
Response.Write respText
Response.End

Function ReadSecret()
  Dim fso, path, ts, txt
  ReadSecret = ""
  Set fso = Server.CreateObject("Scripting.FileSystemObject")
  path = Server.MapPath("recaptcha-secret.config")
  If fso.FileExists(path) Then
    Set ts = fso.OpenTextFile(path, 1)
    txt = Trim(ts.ReadAll)
    ts.Close
    ReadSecret = txt
  End If
End Function

Function VerifyRecaptcha(secret, token, remoteIp, ByRef errCode)
  VerifyRecaptcha = False
  errCode = ""
  If token = "" Then
    errCode = "missing-input-response"
    Exit Function
  End If

  Dim http, postData, json, scorePos, actionPos, scoreVal, actionVal
  Set http = Server.CreateObject("MSXML2.ServerXMLHTTP.6.0")
  If Err.Number <> 0 Then
    Err.Clear
    Set http = Server.CreateObject("MSXML2.ServerXMLHTTP")
  End If
  If Err.Number <> 0 Then
    errCode = "http-client-missing"
    Exit Function
  End If

  postData = "secret=" & Server.URLEncode(secret) & "&response=" & Server.URLEncode(token)
  If remoteIp <> "" Then postData = postData & "&remoteip=" & Server.URLEncode(remoteIp)

  http.setTimeouts 5000, 5000, 15000, 20000
  http.Open "POST", "https://www.google.com/recaptcha/api/siteverify", False
  http.setRequestHeader "Content-Type", "application/x-www-form-urlencoded"
  http.Send postData
  If Err.Number <> 0 Then
    errCode = "siteverify-failed"
    Exit Function
  End If

  json = http.responseText
  If InStr(1, json, """success"": true", 1) = 0 And InStr(1, json, """success"":true", 1) = 0 Then
    errCode = "verification-failed"
    Exit Function
  End If

  scorePos = InStr(1, json, """score"":", 1)
  If scorePos > 0 Then
    scoreVal = Mid(json, scorePos + 8, 8)
    scoreVal = Replace(Replace(Trim(scoreVal), ",", ""), "}", "")
    If IsNumeric(scoreVal) Then
      If CDbl(scoreVal) < MIN_SCORE Then
        errCode = "low-score"
        Exit Function
      End If
    End If
  End If

  actionPos = InStr(1, json, """action"":""", 1)
  If actionPos > 0 Then
    actionVal = Mid(json, actionPos + 11, 64)
    actionVal = Left(actionVal, InStr(1, actionVal, """", 1) - 1)
    If LCase(actionVal) <> LCase(EXPECTED_ACTION) Then
      errCode = "bad-action"
      Exit Function
    End If
  End If

  VerifyRecaptcha = True
End Function

Function JsonEscape(value)
  Dim s
  s = value & ""
  s = Replace(s, "\", "\\")
  s = Replace(s, """", "\""")
  s = Replace(s, vbCr, " ")
  s = Replace(s, vbLf, " ")
  JsonEscape = s
End Function
%>
