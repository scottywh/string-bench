.class public Lcom/chordbench/app/MainActivity;
.super Landroid/app/Activity;
.source "MainActivity.java"

# Hosts one full-screen WebView that loads the bundled web app from assets.
.implements Ljava/lang/Runnable;

.field cmd:I
.field arg:Z
.field pending:Landroid/webkit/PermissionRequest;
.field wv:Landroid/webkit/WebView;

.method public constructor <init>()V
    .locals 0
    invoke-direct {p0}, Landroid/app/Activity;-><init>()V
    return-void
.end method

.method protected onCreate(Landroid/os/Bundle;)V
    .locals 5
    invoke-super {p0, p1}, Landroid/app/Activity;->onCreate(Landroid/os/Bundle;)V

    const v0, 0xff0c1112
    invoke-virtual {p0}, Landroid/app/Activity;->getWindow()Landroid/view/Window;
    move-result-object v1
    invoke-virtual {v1, v0}, Landroid/view/Window;->setStatusBarColor(I)V
    invoke-virtual {v1, v0}, Landroid/view/Window;->setNavigationBarColor(I)V

    new-instance v2, Landroid/webkit/WebView;
    invoke-direct {v2, p0}, Landroid/webkit/WebView;-><init>(Landroid/content/Context;)V
    iput-object v2, p0, Lcom/chordbench/app/MainActivity;->wv:Landroid/webkit/WebView;
    invoke-virtual {v2, v0}, Landroid/webkit/WebView;->setBackgroundColor(I)V

    invoke-virtual {v2}, Landroid/webkit/WebView;->getSettings()Landroid/webkit/WebSettings;
    move-result-object v3
    const/4 v4, 0x1
    invoke-virtual {v3, v4}, Landroid/webkit/WebSettings;->setJavaScriptEnabled(Z)V
    invoke-virtual {v3, v4}, Landroid/webkit/WebSettings;->setDomStorageEnabled(Z)V
    const/4 v4, 0x0
    invoke-virtual {v3, v4}, Landroid/webkit/WebSettings;->setMediaPlaybackRequiresUserGesture(Z)V

    new-instance v3, Lcom/chordbench/app/Bridge;
    invoke-direct {v3, p0}, Lcom/chordbench/app/Bridge;-><init>(Lcom/chordbench/app/MainActivity;)V
    const-string v4, "ChordBenchApp"
    invoke-virtual {v2, v3, v4}, Landroid/webkit/WebView;->addJavascriptInterface(Ljava/lang/Object;Ljava/lang/String;)V

    new-instance v3, Landroid/webkit/WebViewClient;
    invoke-direct {v3}, Landroid/webkit/WebViewClient;-><init>()V
    invoke-virtual {v2, v3}, Landroid/webkit/WebView;->setWebViewClient(Landroid/webkit/WebViewClient;)V

    new-instance v3, Lcom/chordbench/app/Chrome;
    invoke-direct {v3, p0}, Lcom/chordbench/app/Chrome;-><init>(Lcom/chordbench/app/MainActivity;)V
    invoke-virtual {v2, v3}, Landroid/webkit/WebView;->setWebChromeClient(Landroid/webkit/WebChromeClient;)V

    invoke-virtual {p0, v2}, Landroid/app/Activity;->setContentView(Landroid/view/View;)V

    const-string v3, "file:///android_asset/index.html"
    invoke-virtual {v2, v3}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V
    return-void
.end method

# Back goes through the web app's own history first (screens use #hash routes).
.method public onBackPressed()V
    .locals 2
    iget-object v0, p0, Lcom/chordbench/app/MainActivity;->wv:Landroid/webkit/WebView;
    invoke-virtual {v0}, Landroid/webkit/WebView;->canGoBack()Z
    move-result v1
    if-eqz v1, :cond_exit
    invoke-virtual {v0}, Landroid/webkit/WebView;->goBack()V
    return-void
    :cond_exit
    invoke-super {p0}, Landroid/app/Activity;->onBackPressed()V
    return-void
.end method

# Result of the one-time microphone permission dialog.
.method public onRequestPermissionsResult(I[Ljava/lang/String;[I)V
    .locals 2
    invoke-super {p0, p1, p2, p3}, Landroid/app/Activity;->onRequestPermissionsResult(I[Ljava/lang/String;[I)V
    iget-object v0, p0, Lcom/chordbench/app/MainActivity;->pending:Landroid/webkit/PermissionRequest;
    if-eqz v0, :cond_done
    const/4 v1, 0x0
    iput-object v1, p0, Lcom/chordbench/app/MainActivity;->pending:Landroid/webkit/PermissionRequest;
    array-length v1, p3
    if-lez v1, :cond_deny
    const/4 v1, 0x0
    aget v1, p3, v1
    if-nez v1, :cond_deny
    invoke-virtual {v0}, Landroid/webkit/PermissionRequest;->getResources()[Ljava/lang/String;
    move-result-object v1
    invoke-virtual {v0, v1}, Landroid/webkit/PermissionRequest;->grant([Ljava/lang/String;)V
    return-void
    :cond_deny
    invoke-virtual {v0}, Landroid/webkit/PermissionRequest;->deny()V
    :cond_done
    return-void
.end method

# Called from the JS bridge thread; the work itself runs on the UI thread in run().
.method queue(IZ)V
    .locals 0
    iput p1, p0, Lcom/chordbench/app/MainActivity;->cmd:I
    iput-boolean p2, p0, Lcom/chordbench/app/MainActivity;->arg:Z
    invoke-virtual {p0, p0}, Landroid/app/Activity;->runOnUiThread(Ljava/lang/Runnable;)V
    return-void
.end method

# cmd 1 = keep screen on, cmd 2 = immersive full screen
.method public run()V
    .locals 3
    invoke-virtual {p0}, Landroid/app/Activity;->getWindow()Landroid/view/Window;
    move-result-object v0
    iget v1, p0, Lcom/chordbench/app/MainActivity;->cmd:I
    const/4 v2, 0x1
    if-ne v1, v2, :cond_full
    iget-boolean v1, p0, Lcom/chordbench/app/MainActivity;->arg:Z
    const/16 v2, 0x80
    if-eqz v1, :cond_clear
    invoke-virtual {v0, v2}, Landroid/view/Window;->addFlags(I)V
    return-void
    :cond_clear
    invoke-virtual {v0, v2}, Landroid/view/Window;->clearFlags(I)V
    return-void
    :cond_full
    invoke-virtual {v0}, Landroid/view/Window;->getDecorView()Landroid/view/View;
    move-result-object v0
    iget-boolean v1, p0, Lcom/chordbench/app/MainActivity;->arg:Z
    const/4 v2, 0x0
    if-eqz v1, :cond_apply
    const/16 v2, 0x1706
    :cond_apply
    invoke-virtual {v0, v2}, Landroid/view/View;->setSystemUiVisibility(I)V
    return-void
.end method
