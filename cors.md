# Cloudflare R2 CORS policy for `course-content`

In Cloudflare, open **R2 → course-content → Settings → CORS Policy** and add
this policy:

```json
[
  {
    "AllowedOrigins": [
      "https://version1awraq-zan.vercel.app",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

If you use a custom domain, add its exact origin (for example,
`https://courses.example.com`) to `AllowedOrigins`. Do not include a trailing
slash. Save the policy, then retry the upload.

For lesson videos to upload directly from the browser to R2, both this saved
bucket policy and the latest application deployment are required. The app
generates a presigned upload URL; the file itself is sent directly to R2 with
`PUT`. After deploying, reload the lesson editor before trying again.

To verify the policy in the browser, open Developer Tools → Network, select
the failed R2 `OPTIONS` request, and check that its response is `204` and
contains `Access-Control-Allow-Origin:
https://version1awraq-zan.vercel.app` and
`Access-Control-Allow-Methods` including `PUT`. If the `OPTIONS` request
passes but the following `PUT` fails, inspect the `PUT` response status: the
problem is then the upload URL/signature or R2 response, not CORS.
