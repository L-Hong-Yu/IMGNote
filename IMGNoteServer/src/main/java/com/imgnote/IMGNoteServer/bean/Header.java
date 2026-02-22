package com.imgnote.IMGNoteServer.bean;

import com.imgnote.IMGNoteServer.enums.EncodeTypeEnum;
import com.imgnote.IMGNoteServer.enums.EncodingEnum;
import lombok.Data;

@Data
public class Header {

    private short recognition;

    private EncodeTypeEnum encryptionType;

    private EncodingEnum encoding;

    private Pixel startPixel;

    private Pixel endPixel;

    private Long time;

    private String dataMd5;

    private String verifyCode;

    public String getRecognition() {
        int unsignedShort = recognition & 0xFFFF;
        return String.format("%16s", Integer.toBinaryString(unsignedShort)).replace(' ', '0');
    }

    public short getRecognitionShort() {
        return recognition;
    }

    public void setRecognition(String recognition) {
        this.recognition = (short) Integer.parseInt(recognition, 2);
    }

    public void setRecognitionShort(short recognition) {
        this.recognition = recognition;
    }

}
