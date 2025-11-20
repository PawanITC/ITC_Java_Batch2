package com.learning.tribetalk.service.mongo.impl;

import com.learning.tribetalk.service.mongo.S3Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.UUID;

@Service
public class S3ServiceImpl implements S3Service {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    @Value("${spring.aws.bucket}")
    private String bucket;

    public S3ServiceImpl(S3Client s3Client, S3Presigner s3Presigner) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
    }

    @Override
    public String uploadFile(MultipartFile file) throws IOException {
        String key = UUID.randomUUID()+"_"+sanitizeFilename(file.getOriginalFilename());

        PutObjectRequest request = PutObjectRequest
                .builder()
                .bucket(bucket)
                .key(key)
                .contentType(file.getContentType())
                .build();

        s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        // Return only the key (store in DB)
        return key;
//        return String.format("https://%s.s3.%s.amazonaws.com/%s",
//                bucket,
//                s3Client.serviceClientConfiguration().region().id(),
//                key);
    }

    @Override
    public void deleteFile(String Key) {
        DeleteObjectRequest request = DeleteObjectRequest
                .builder()
                .bucket(bucket)
                .key(Key)
                .build();
        s3Client.deleteObject(request);

    }

    public String generatePresignedUrl(String key, Duration expiry) {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(expiry)
                .getObjectRequest(getObjectRequest)
                .build();

        return s3Presigner.presignGetObject(presignRequest).url().toString();
    }

    public String sanitizeFilename(String filename) {
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
