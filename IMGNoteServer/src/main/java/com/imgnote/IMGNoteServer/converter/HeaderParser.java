package com.imgnote.IMGNoteServer.converter;

import com.imgnote.IMGNoteServer.bean.Constants;
import com.imgnote.IMGNoteServer.bean.Header;
import com.imgnote.IMGNoteServer.bean.HeaderBits;
import com.imgnote.IMGNoteServer.bean.Pixel;
import com.imgnote.IMGNoteServer.enums.EncodeTypeEnum;
import com.imgnote.IMGNoteServer.enums.EncodingEnum;
import com.imgnote.IMGNoteServer.utils.StringTools;

public class HeaderParser {

    private final Header targetHeader;

    private final String headerBitsStr;

    private final HeaderBits headerBits = new HeaderBits();

    public HeaderParser(Header targetHeader, String headerBitsStr) {
        this.targetHeader = targetHeader;
        this.headerBitsStr = headerBitsStr;
    }

    private void parseHeaderBitStr() {
        int pointer = 0;
        String recognitionBits = headerBitsStr.substring(pointer, pointer += Constants.RECOGNITION_LENGTH);
        String encryptionTypeBits = headerBitsStr.substring(pointer, pointer += Constants.ENCRYPTION_TYPE_LENGTH);
        String encodingBits = headerBitsStr.substring(pointer, pointer += Constants.ENCODING_LENGTH);
        String startRowBits = headerBitsStr.substring(pointer, pointer += Constants.START_ROW_LENGTH);
        String startColBits = headerBitsStr.substring(pointer, pointer += Constants.START_COL_LENGTH);
        String endRowBits = headerBitsStr.substring(pointer, pointer += Constants.END_ROW_LENGTH);
        String endColBits = headerBitsStr.substring(pointer, pointer += Constants.END_COL_LENGTH);
        String timestampBits = headerBitsStr.substring(pointer, pointer += Constants.TIMESTAMP_LENGTH);
        String md5Bits = headerBitsStr.substring(pointer, pointer += Constants.MD5_LENGTH);
        String verifyCodeBits = headerBitsStr.substring(pointer, pointer += Constants.VERIFY_CODE_LENGTH);

        headerBits.setRecognition(recognitionBits);
        headerBits.setEncryptionType(encryptionTypeBits);
        headerBits.setEncoding(encodingBits);
        headerBits.setStartRow(startRowBits);
        headerBits.setStartCol(startColBits);
        headerBits.setEndRow(endRowBits);
        headerBits.setEndCol(endColBits);
        headerBits.setTimestamp(timestampBits);
        headerBits.setDataMd5(md5Bits);
        headerBits.setVerifyCode(verifyCodeBits);
    }

    private void parseRecognition() {
        targetHeader.setRecognition(headerBits.getRecognition());
    }

    private void parseEncryptionType() {
        EncodeTypeEnum encryptionType = EncodeTypeEnum.getByCode(headerBits.getEncryptionType());
        targetHeader.setEncryptionType(encryptionType);
    }

    private void parseEncoding() {
        EncodingEnum encoding = EncodingEnum.getByCode(headerBits.getEncoding());
        targetHeader.setEncoding(encoding);
    }

    private void parseStart() {
        Pixel startPixel = new Pixel(
                Integer.parseInt(headerBits.getStartRow(), 2),
                Integer.parseInt(headerBits.getStartCol(), 2)
        );
        targetHeader.setStartPixel(startPixel);
    }

    private void parseEnd() {
        Pixel endPixel = new Pixel(
                Integer.parseInt(headerBits.getEndRow(), 2),
                Integer.parseInt(headerBits.getEndCol(), 2)
        );
        targetHeader.setEndPixel(endPixel);
    }

    private void parseTimestamp() {
        long timestamp = Long.parseLong(headerBits.getTimestamp(), 2);
        targetHeader.setTime(timestamp);
    }

    private void parseMd5() {
        String dataMd5Str = StringTools.binaryMd5ToHex(headerBits.getDataMd5());
        targetHeader.setDataMd5(dataMd5Str);
    }

    private void parseVerifyCode() {
        String verifyCode = StringTools.binaryMd5ToHex(headerBits.getVerifyCode());
        targetHeader.setVerifyCode(verifyCode);
    }

    public void parse() {

        parseHeaderBitStr();

        parseRecognition();

        parseEncryptionType();

        parseEncoding();

        parseStart();

        parseEnd();

        parseTimestamp();

        parseMd5();

        parseVerifyCode();

    }

}
