package com.imgnote.IMGNoteServer.utils;

import com.imgnote.IMGNoteServer.bean.Constants;
import com.imgnote.IMGNoteServer.bean.Img;
import com.imgnote.IMGNoteServer.enums.ResponseCodeEnum;
import com.imgnote.IMGNoteServer.exceptions.BusinessException;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;

public class ImgTools {

    public static Img getBasicImg(BufferedImage image) {
        int width = image.getWidth();
        int height = image.getHeight();
        return new Img(width, height, getMaxContentLen(width, height), null);
    }

    public static long getMaxContentLen(int imgWidth, int imgHeight) {

        long totalPixels = (long) imgWidth * imgHeight;
        long totalBits = (totalPixels - 1) * 4;
        long headerBits = (Constants.HEADER_LENGTH + 3) / 4 * 4;
        long availableBits = totalBits - headerBits;

        return availableBits / 8;
    }

    /**
     * 将指定坐标的像素点保存为图片
     */
    public static void saveImg(Img img, String outputPath, String format) {
        int imgWidth = img.getWidth();
        int imgHeight = img.getHeight();

        BufferedImage image = new BufferedImage(imgWidth, imgHeight, BufferedImage.TYPE_INT_ARGB);

        // 初始化背景色
        Color bgColor = Color.WHITE;
        for (int y = 0; y < imgHeight; y++) {
            for (int x = 0; x < imgWidth; x++) {
                image.setRGB(x, y, bgColor.getRGB());
            }
        }

        image.setRGB(0, 0, imgWidth, imgHeight, img.getPixels(), 0, imgWidth);

        // 保存到指定路径
        try {
            File outputFile = new File(outputPath);
            ImageIO.write(image, format, outputFile);
        } catch (IOException e) {
            throw new BusinessException(ResponseCodeEnum.CODE_412);
        }
    }

    /**
     * 提取从指定范围像素的位置和颜色
     * @param startX 起始X坐标
     * @param startY 起始Y坐标
     * @param endX 结束X坐标
     * @param endY 结束Y坐标
     */
    public static int[] getPixelRangeInfo(BufferedImage image, int startX, int startY, int endX, int endY) {

        int[] pixelList = new int[(endY - startY - 1) * image.getWidth() + endX + 1 + image.getWidth() - startX];
        int index = 0;
        for (int y = startY; y <= endY; y++) {
            int maxX = y == endY ? endX : image.getWidth() - 1;
            int minX = y == startY ? startX : 0;
            for (int x = minX; x <= maxX; x++, index++) {
                pixelList[index] = image.getRGB(x, y);
            }
        }
        return pixelList;

    }

}