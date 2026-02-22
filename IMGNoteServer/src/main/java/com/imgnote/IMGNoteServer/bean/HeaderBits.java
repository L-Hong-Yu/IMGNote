package com.imgnote.IMGNoteServer.bean;

import lombok.Data;

@Data
public class HeaderBits {

    private short recognition;

    private String encryptionType;

    private String encoding;

    private String startRow;

    private String endRow;

    private String startCol;

    private String endCol;

    private String timestamp;

    private String dataMd5;

    private String verifyCode;

    @Override
    public String toString() {
        int unsignedShort = recognition & 0xFFFF;
        String fullBinaryStr = String.format("%16s", Integer.toBinaryString(unsignedShort)).replace(' ', '0');

        String[] fields = {encryptionType, encoding, startRow, startCol, endRow, endCol, timestamp, dataMd5, verifyCode};
        StringBuilder sb = new StringBuilder(fullBinaryStr);
        for (String field : fields) {
            sb.append(field);
        }
        return sb.toString();
    }

    public String getRecognition() {
        int unsignedShort = recognition & 0xFFFF;
        return String.format("%16s", Integer.toBinaryString(unsignedShort)).replace(' ', '0');
    }

    public void setRecognition(String recognition) {
        this.recognition = (short) Integer.parseInt(recognition, 2);
    }

}
