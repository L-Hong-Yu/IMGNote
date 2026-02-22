package com.imgnote.IMGNoteServer.utils;

import com.imgnote.IMGNoteServer.enums.ResponseCodeEnum;
import com.imgnote.IMGNoteServer.exceptions.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.digest.DigestUtils;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Slf4j
public class StringTools {

    public static String bytesToBinaryString(byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            int unsignedByte = b & 0xFF;
            String binaryStr = String.format("%8s", Integer.toBinaryString(unsignedByte))
                    .replace(' ', '0');
            sb.append(binaryStr);
        }
        return sb.toString();
    }

    public static String intToBinaryString(int num, int length) {
        return String.format("%" + length + "s", Integer.toBinaryString(num))
                .replace(' ', '0');
    }

    public static String longToBinaryString(long num, int length) {
        return String.format("%" + length + "s", Long.toBinaryString(num))
                .replace(' ', '0');
    }

    public static String getMD5OfString(String str) {
        byte[] bytes = DigestUtils.md5(str.getBytes(StandardCharsets.UTF_8));
        return bytesToBinaryString(bytes);
    }

    public static String stringToBytes(String str) {
        byte [] bytes = str.getBytes(StandardCharsets.UTF_8);
        return bytesToBinaryString(bytes);
    }

    public static String bytesToString(String bytesStr) {
        if (bytesStr == null || bytesStr.isEmpty()) {
            return "";
        }

        // 每8位分割二进制字符串
        byte[] bytes = new byte[bytesStr.length() / 8];
        for (int i = 0; i < bytesStr.length(); i += 8) {
            String byteStr = bytesStr.substring(i, i + 8);
            bytes[i / 8] = (byte) Integer.parseInt(byteStr, 2);
        }

        return new String(bytes, StandardCharsets.UTF_8);
    }

    public static String binaryMd5ToHex(String binaryStr) {
        if (binaryStr == null || binaryStr.length() != 128) {
            throw new BusinessException("MD5二进制字符串必须是128位长度");
        }

        StringBuilder hexBuilder = new StringBuilder();

        for (int i = 0; i < 128; i += 4) {
            String fourBits = binaryStr.substring(i, i + 4);
            int decimal = Integer.parseInt(fourBits, 2);
            hexBuilder.append(Integer.toHexString(decimal));
        }

        return hexBuilder.toString();
    }

    /**
     * 计算文件的MD5值
     */
    public static String getFileMD5(String filePath) {
        File file = new File(filePath);
        if (!file.exists()) {
            log.error("文件不存在: {}", filePath);
            throw new BusinessException(ResponseCodeEnum.CODE_502);
        }
        // 使用BufferedInputStream缓冲流
        try (FileInputStream fis = new FileInputStream(file);
             BufferedInputStream bis = new BufferedInputStream(fis)) {
            return DigestUtils.md5Hex(bis);
        } catch (IOException e) {
            log.error("计算文件MD5失败: {}", e.getMessage(), e);
            throw new BusinessException(ResponseCodeEnum.CODE_502);
        }
    }

    /**
     * 计算文件的MD5值（二进制格式）
     */
    public static String getFileMD5Binary(String filePath) {
        String hexMd5 = getFileMD5(filePath);
        // 将十六进制MD5转换为二进制
        StringBuilder binaryMd5 = new StringBuilder();
        for (int i = 0; i < hexMd5.length(); i += 2) {
            String hexPair = hexMd5.substring(i, i + 2);
            int decimal = Integer.parseInt(hexPair, 16);
            String binary = String.format("%8s", Integer.toBinaryString(decimal)).replace(' ', '0');
            binaryMd5.append(binary);
        }
        return binaryMd5.toString();
    }

}
