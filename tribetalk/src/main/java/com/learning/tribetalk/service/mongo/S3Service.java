package com.learning.tribetalk.service.mongo;


import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Duration;

public interface S3Service {
    String uploadFile(MultipartFile file) throws IOException;
    void deleteFile(String Key);
    String generatePresignedUrl(String key, Duration expiry);
    String sanitizeFilename(String filename);
}
