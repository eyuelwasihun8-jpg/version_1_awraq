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
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

If you use a custom domain, add its exact origin (for example,
`https://courses.example.com`) to `AllowedOrigins`. Do not include a trailing
slash. Save the policy, then retry the upload.
