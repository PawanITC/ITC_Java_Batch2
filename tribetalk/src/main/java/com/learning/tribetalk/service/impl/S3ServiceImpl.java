package com.learning.tribetalk.service.impl;

import com.learning.tribetalk.service.S3Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.IOException;
import java.util.UUID;

@Service
public class S3ServiceImpl implements S3Service {

    private final S3Client s3Client;
    @Value("${spring.aws.bucket}")
    private String bucket;

    public S3ServiceImpl(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    @Override
    public String uploadFile(MultipartFile file) throws IOException {
        String key = UUID.randomUUID()+"_"+file.getOriginalFilename();

        PutObjectRequest request = PutObjectRequest
                .builder()
                .bucket(bucket)
                .key(key)
                .contentType(file.getContentType())
                .build();

        s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

        return String.format("https://%s.s3.%s.amazonaws.com/%s",
                bucket,
                s3Client.serviceClientConfiguration().region().id(),
                key);
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


}
