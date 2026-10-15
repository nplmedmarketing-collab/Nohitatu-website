<%@ Page Language="C#" EnableSessionState="False" %>
<script runat="server">
void Page_Load(object sender, EventArgs e)
{
  Response.ContentType = "application/json";
  Response.Write("{\"ok\":true,\"method\":\"" + Request.HttpMethod + "\"}");
}
</script>
