.class public Lcom/chordbench/app/Chrome;
.super Landroid/webkit/WebChromeClient;
.source "Chrome.java"

# Passes the page's microphone request to Android's runtime permission.
.field a:Lcom/chordbench/app/MainActivity;

.method public constructor <init>(Lcom/chordbench/app/MainActivity;)V
    .locals 0
    invoke-direct {p0}, Landroid/webkit/WebChromeClient;-><init>()V
    iput-object p1, p0, Lcom/chordbench/app/Chrome;->a:Lcom/chordbench/app/MainActivity;
    return-void
.end method

.method public onPermissionRequest(Landroid/webkit/PermissionRequest;)V
    .locals 4
    iget-object v0, p0, Lcom/chordbench/app/Chrome;->a:Lcom/chordbench/app/MainActivity;
    const-string v1, "android.permission.RECORD_AUDIO"
    invoke-virtual {v0, v1}, Landroid/app/Activity;->checkSelfPermission(Ljava/lang/String;)I
    move-result v2
    if-nez v2, :cond_ask
    invoke-virtual {p1}, Landroid/webkit/PermissionRequest;->getResources()[Ljava/lang/String;
    move-result-object v2
    invoke-virtual {p1, v2}, Landroid/webkit/PermissionRequest;->grant([Ljava/lang/String;)V
    return-void
    :cond_ask
    iput-object p1, v0, Lcom/chordbench/app/MainActivity;->pending:Landroid/webkit/PermissionRequest;
    const/4 v2, 0x1
    new-array v2, v2, [Ljava/lang/String;
    const/4 v3, 0x0
    aput-object v1, v2, v3
    const/4 v3, 0x7
    invoke-virtual {v0, v2, v3}, Landroid/app/Activity;->requestPermissions([Ljava/lang/String;I)V
    return-void
.end method
