package com.imgnote.IMGNoteServer.ImgProcessor;

import com.imgnote.IMGNoteServer.bean.*;
import com.imgnote.IMGNoteServer.enums.ResponseCodeEnum;
import com.imgnote.IMGNoteServer.exceptions.BusinessException;
import com.imgnote.IMGNoteServer.utils.ColorUtils;
import com.imgnote.IMGNoteServer.utils.ImgTools;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.Random;

@Slf4j
public class ImgGen extends ImgTools {

    @Getter
    private Pixel startPixel;

    @Getter
    private Pixel endPixel;

    private HeaderBits headerBits;

    private String dataBits;

    private final Img img;

    private final String outputPath;

    private final String format;

    private final BufferedImage image;

    public ImgGen(String originPath, String outputPath, String format) {
        this.outputPath = outputPath;
        this.format = format;
        try {
            this.image = ImageIO.read(new File(originPath));
        } catch (IOException e) {
            log.error("图片读取失败: {}", e.getMessage());
            throw new BusinessException(ResponseCodeEnum.CODE_411);
        }
        this.img = getBasicImg(image);
        buildImg();
    }

    private void buildImg() {
        int[] allPixels = getPixelRangeInfo(image, 0, 0, img.getWidth() - 1, img.getHeight() - 1);
        img.setPixels(allPixels);
    }

    private void insertHeader() {
        String headerStr = headerBits.toString();
        int pixelsLenForHeader = (headerStr.length() + 4 - 1) / 4;
        // headerStr补充为4字节
        headerStr += "0000".substring(0, 4 - headerStr.length() % 4);
        for (int i = 0; i < pixelsLenForHeader; i++) {
            int startIndex = i * 4;
            int endIndex = Math.min(startIndex + 4, headerStr.length());
            String rgbaBits = headerStr.substring(startIndex, endIndex);
            img.getPixels()[i] = buildPixel(img.getPixels()[i], rgbaBits);
        }
    }

    private void insertData() {
        int pixelsLenForData = (dataBits.length() + 4 - 1) / 4;
        int startIndex = startPixel.getY() * img.getWidth() + startPixel.getX();
        for (int i = 0; i < pixelsLenForData; i++) {
            int dataStartIndex = i * 4;
            int dataEndIndex = Math.min(dataStartIndex + 4, dataBits.length());
            String rgbaBits = dataBits.substring(dataStartIndex,dataEndIndex);
            img.getPixels()[startIndex + i] = buildPixel(img.getPixels()[startIndex + i], rgbaBits);
        }
    }

    private int buildPixel(int pixel, String rgbaBits) {
        // 字符转换为整数
        int rBit = rgbaBits.charAt(0) - '0';
        int gBit = rgbaBits.charAt(1) - '0';
        int bBit = rgbaBits.charAt(2) - '0';
        int aBit = rgbaBits.charAt(3) - '0';

        int pixelR = ColorUtils.getR(pixel);
        int pixelG = ColorUtils.getG(pixel);
        int pixelB = ColorUtils.getB(pixel);
        int pixelA = ColorUtils.getA(pixel);

        // 执行位运算
        pixelR = ((pixelR & ~1) | rBit);
        pixelG = ((pixelG & ~1) | gBit);
        pixelB = ((pixelB & ~1) | bBit);
        pixelA = ((pixelA & ~1) | aBit);

        return ColorUtils.argb(pixelA, pixelR, pixelG, pixelB);
    }

    public void genStartAndEnd(String dataBits) {
        this.dataBits = dataBits;

        int allPixelsLen = img.getWidth() * img.getHeight();

        int pixelsLenForHeader = (Constants.HEADER_LENGTH + 4 - 1) / 4;
        int headerEndX = pixelsLenForHeader % img.getWidth() - 1;
        int headerEndY = pixelsLenForHeader / img.getHeight();

        int pixelsLenForData = dataBits.length() / 4;

        int availablePixels = allPixelsLen - pixelsLenForHeader;
        if (availablePixels <= pixelsLenForData) {
            log.error("数据长度超出图片容量, 可用容量: {}像素, 数据长度: {}像素", availablePixels, pixelsLenForData);
            throw new BusinessException("图片容量不足");
        }

        // 随机生成startPixel
        int startIndex = 1 + new Random().nextInt(allPixelsLen - pixelsLenForHeader - pixelsLenForData);
        int endIndex = startIndex + pixelsLenForData - 1;

        // 计算startPixel
        int startX;
        int startY;
        if ((startIndex + headerEndX + 1) <= img.getWidth()) {
            startX = headerEndX + startIndex;
            startY = headerEndY;
        } else {
            startX = (startIndex - (img.getWidth() - headerEndX - 1)) % img.getWidth() - 1;
            startY = (startIndex - (img.getWidth() - headerEndX - 1)) / img.getWidth() + headerEndY + 1;
        }
        this.startPixel = new Pixel(startX, startY);

        // 计算endPixel
        int endX;
        int endY;
        if ((endIndex + headerEndX + 1) <= img.getWidth()) {
            endX = headerEndX + endIndex;
            endY = headerEndY;
        } else {
            endX = (endIndex - (img.getWidth() - headerEndX - 1)) % img.getWidth() - 1;
            endY = (endIndex - (img.getWidth() - headerEndX - 1)) / img.getWidth() + headerEndY + 1;
        }
        this.endPixel = new Pixel(endX, endY);

    }

    public void gen(HeaderBits headerBits, Pixel startPixel) {

        this.headerBits = headerBits;
        this.startPixel = startPixel;

        insertHeader();

        insertData();

        saveImg(img, outputPath, format);
    }

}
