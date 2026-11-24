.class public Lcom/chordbench/app/Bridge;
.super Ljava/lang/Object;
.source "Bridge.java"

# Exposed to the web app as window.ChordBenchApp.
.field a:Lcom/chordbench/app/MainActivity;

.method public constructor <init>(Lcom/chordbench/app/MainActivity;)V
    .locals 0
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V
    iput-object p1, p0, Lcom/chordbench/app/Bridge;->a:Lcom/chordbench/app/MainActivity;
    return-void
.end method

.method public keepAwake(Z)V
    .locals 2
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    iget-object v0, p0, Lcom/chordbench/app/Bridge;->a:Lcom/chordbench/app/MainActivity;
    const/4 v1, 0x1
    invoke-virtual {v0, v1, p1}, Lcom/chordbench/app/MainActivity;->queue(IZ)V
    return-void
.end method

.method public fullscreen(Z)V
    .locals 2
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    iget-object v0, p0, Lcom/chordbench/app/Bridge;->a:Lcom/chordbench/app/MainActivity;
    const/4 v1, 0x2
    invoke-virtual {v0, v1, p1}, Lcom/chordbench/app/MainActivity;->queue(IZ)V
    return-void
.end method

# Saves a file into Downloads/@FOLDER@ through MediaStore. Returns "ok" or an error message.
.method public saveFile(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
    .locals 6
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    :try_start_0
    iget-object v0, p0, Lcom/chordbench/app/Bridge;->a:Lcom/chordbench/app/MainActivity;
    invoke-virtual {v0}, Landroid/app/Activity;->getContentResolver()Landroid/content/ContentResolver;
    move-result-object v0

    new-instance v1, Landroid/content/ContentValues;
    invoke-direct {v1}, Landroid/content/ContentValues;-><init>()V
    const-string v2, "_display_name"
    invoke-virtual {v1, v2, p1}, Landroid/content/ContentValues;->put(Ljava/lang/String;Ljava/lang/String;)V
    const-string v2, "mime_type"
    invoke-virtual {v1, v2, p2}, Landroid/content/ContentValues;->put(Ljava/lang/String;Ljava/lang/String;)V
    const-string v2, "relative_path"
    const-string v3, "Download/@FOLDER@"
    invoke-virtual {v1, v2, v3}, Landroid/content/ContentValues;->put(Ljava/lang/String;Ljava/lang/String;)V

    const-string v2, "content://media/external/downloads"
    invoke-static {v2}, Landroid/net/Uri;->parse(Ljava/lang/String;)Landroid/net/Uri;
    move-result-object v2
    invoke-virtual {v0, v2, v1}, Landroid/content/ContentResolver;->insert(Landroid/net/Uri;Landroid/content/ContentValues;)Landroid/net/Uri;
    move-result-object v2
    invoke-virtual {v0, v2}, Landroid/content/ContentResolver;->openOutputStream(Landroid/net/Uri;)Ljava/io/OutputStream;
    move-result-object v3

    const/4 v4, 0x0
    invoke-static {p3, v4}, Landroid/util/Base64;->decode(Ljava/lang/String;I)[B
    move-result-object v4
    invoke-virtual {v3, v4}, Ljava/io/OutputStream;->write([B)V
    invoke-virtual {v3}, Ljava/io/OutputStream;->close()V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    const-string v0, "ok"
    return-object v0

    :catch_0
    move-exception v0
    invoke-virtual {v0}, Ljava/lang/Throwable;->getMessage()Ljava/lang/String;
    move-result-object v0
    if-nez v0, :cond_msg
    const-string v0, "error"
    :cond_msg
    return-object v0
.end method

# Lists the audio inputs Android currently sees, as "type:name;type:name;" (AudioDeviceInfo type ids).
.method public inputs()Ljava/lang/String;
    .locals 5
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    :try_start_0
    iget-object v0, p0, Lcom/chordbench/app/Bridge;->a:Lcom/chordbench/app/MainActivity;
    const-string v1, "audio"
    invoke-virtual {v0, v1}, Landroid/content/Context;->getSystemService(Ljava/lang/String;)Ljava/lang/Object;
    move-result-object v0
    check-cast v0, Landroid/media/AudioManager;
    const/4 v1, 0x1
    invoke-virtual {v0, v1}, Landroid/media/AudioManager;->getDevices(I)[Landroid/media/AudioDeviceInfo;
    move-result-object v0
    new-instance v1, Ljava/lang/StringBuilder;
    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V
    const/4 v2, 0x0
    :loop
    array-length v3, v0
    if-ge v2, v3, :done
    aget-object v3, v0, v2
    invoke-virtual {v3}, Landroid/media/AudioDeviceInfo;->getType()I
    move-result v4
    invoke-virtual {v1, v4}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;
    const-string v4, ":"
    invoke-virtual {v1, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {v3}, Landroid/media/AudioDeviceInfo;->getProductName()Ljava/lang/CharSequence;
    move-result-object v3
    invoke-virtual {v1, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/CharSequence;)Ljava/lang/StringBuilder;
    const-string v4, ";"
    invoke-virtual {v1, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    add-int/lit8 v2, v2, 0x1
    goto :loop
    :done
    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
    move-result-object v0
    return-object v0
    :try_end_0
    .catch Ljava/lang/Throwable; {:try_start_0 .. :try_end_0} :catch_0
    :catch_0
    move-exception v0
    const-string v0, ""
    return-object v0
.end method
