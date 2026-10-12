package com.pondyhub.app;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

/** Lets the web app save generated images (booking tickets), which a WebView can't download on its own. */
public class ImageSaver {

    private static final String ALBUM = "Pondy Hub";

    private final Activity activity;

    ImageSaver(Activity activity) {
        this.activity = activity;
    }

    /** Accepts a PNG as a data URL or bare base64 string. Returns true once the file is written. */
    @JavascriptInterface
    public boolean saveImage(String data, String fileName) {
        try {
            String base64 = data.contains(",") ? data.substring(data.indexOf(',') + 1) : data;
            byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
            String name = sanitize(fileName);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                saveToGallery(bytes, name);
                toast("Ticket saved to Pictures/" + ALBUM);
            } else {
                shareFile(bytes, name);
            }
            return true;
        } catch (Exception e) {
            toast("Couldn't save the ticket");
            return false;
        }
    }

    private void saveToGallery(byte[] bytes, String name) throws Exception {
        ContentResolver resolver = activity.getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.Images.Media.DISPLAY_NAME, name);
        values.put(MediaStore.Images.Media.MIME_TYPE, "image/png");
        values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/" + ALBUM);
        values.put(MediaStore.Images.Media.IS_PENDING, 1);

        Uri uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
        if (uri == null) throw new IllegalStateException("MediaStore insert failed");
        try (OutputStream out = resolver.openOutputStream(uri)) {
            if (out == null) throw new IllegalStateException("No output stream");
            out.write(bytes);
        }
        values.clear();
        values.put(MediaStore.Images.Media.IS_PENDING, 0);
        resolver.update(uri, values, null, null);
    }

    /** Android 9 and older need a storage permission for shared folders, so hand the file to the share sheet instead. */
    private void shareFile(byte[] bytes, String name) throws Exception {
        File file = new File(activity.getCacheDir(), name);
        try (FileOutputStream out = new FileOutputStream(file)) {
            out.write(bytes);
        }
        Uri uri = FileProvider.getUriForFile(activity, activity.getPackageName() + ".fileprovider", file);
        Intent intent = new Intent(Intent.ACTION_SEND)
            .setType("image/png")
            .putExtra(Intent.EXTRA_STREAM, uri)
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        activity.runOnUiThread(() -> activity.startActivity(Intent.createChooser(intent, "Save ticket")));
    }

    private static String sanitize(String fileName) {
        String name = fileName == null || fileName.isEmpty() ? "PondyHub-Ticket.png" : fileName;
        name = name.replaceAll("[^A-Za-z0-9._-]", "_");
        return name.toLowerCase().endsWith(".png") ? name : name + ".png";
    }

    private void toast(String message) {
        activity.runOnUiThread(() -> Toast.makeText(activity, message, Toast.LENGTH_LONG).show());
    }
}
