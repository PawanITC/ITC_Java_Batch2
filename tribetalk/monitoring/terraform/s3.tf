provider "aws" {
  region = var.s3_region
}

resource "aws_s3_bucket" "tribetalk_media" {
  bucket = var.s3_bucket_name
}

resource "aws_s3_bucket_public_access_block" "block_public_access" {
  bucket = aws_s3_bucket.tribetalk_media.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
