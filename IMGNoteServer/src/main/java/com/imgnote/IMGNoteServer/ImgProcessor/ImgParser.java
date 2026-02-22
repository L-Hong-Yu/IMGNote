package com.imgnote.IMGNoteServer.ImgProcessor;

import com.imgnote.IMGNoteServer.bean.Constants;
import com.imgnote.IMGNoteServer.bean.Header;
import com.imgnote.IMGNoteServer.bean.Img;
import com.imgnote.IMGNoteServer.bean.NoteBook;
import com.imgnote.IMGNoteServer.converter.HeaderParser;
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

@Slf4j
public class ImgParser extends ImgTools {

    @Getter
    private String headerBitsStr;

    @Getter
    private final Img img;

    private final Header header;

    private final BufferedImage image;

    public ImgParser(String imagePath, Header header) {
        this.header = header;
        try {
            this.image = ImageIO.read(new File(imagePath));
        } catch (IOException e) {
            log.error("图片读取失败: {}", e.getMessage());
            throw new BusinessException(ResponseCodeEnum.CODE_411);
        }
        this.img = getBasicImg(image);
        parseHeader();
    }

    public void parseHeader() {
        int[] pixels = readPixelForHeader();
        String headerBitsStr = extractStrFromPixels(pixels);
        this.headerBitsStr = headerBitsStr;
        HeaderParser headerParser = new HeaderParser(header, headerBitsStr);
        try {
            headerParser.parse();
        } catch (Exception e) {
            throw new BusinessException(ResponseCodeEnum.CODE_410, new NoteBook(img));
        }
    }

    public String getDataBits() {
        int[] pixels = readPixelForData();
        return extractStrFromPixels(pixels);
    }

    public int[] readPixelForData() {
        int startX = header.getStartPixel().getX();
        int startY = header.getStartPixel().getY();
        int endX = header.getEndPixel().getX();
        int endY = header.getEndPixel().getY();

        return getPixelRangeInfo(image, startX, startY, endX, endY);
    }

    public int[] readPixelForHeader() {
        int pixelsLenForHeader = (Constants.HEADER_LENGTH + 4 - 1) / 4;
        int endX = pixelsLenForHeader % img.getWidth() - 1;
        int endY = pixelsLenForHeader / img.getHeight();

        return getPixelRangeInfo(image, 0, 0, endX, endY);
    }

    public String extractStrFromPixels(int[] pixels) {
        StringBuilder str = new StringBuilder();

        for (int pixel : pixels) {
            int pixelR = ColorUtils.getR(pixel);
            int pixelG = ColorUtils.getG(pixel);
            int pixelB = ColorUtils.getB(pixel);
            int pixelA = ColorUtils.getA(pixel);

            str.append(pixelR & 1);
            str.append(pixelG & 1);
            str.append(pixelB & 1);
            str.append(pixelA & 1);
        }

        return str.toString();
    }

}
