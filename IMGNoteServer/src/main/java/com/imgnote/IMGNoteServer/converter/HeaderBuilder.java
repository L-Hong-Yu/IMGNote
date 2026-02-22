package com.imgnote.IMGNoteServer.converter;

import com.imgnote.IMGNoteServer.bean.Constants;
import com.imgnote.IMGNoteServer.bean.HeaderBits;
import com.imgnote.IMGNoteServer.bean.Header;
import com.imgnote.IMGNoteServer.utils.StringTools;

public class HeaderBuilder {

    private final HeaderBits targetHeaderBits;

    public HeaderBuilder(HeaderBits targetHeaderBits) {
        this.targetHeaderBits = targetHeaderBits;
    }

    private void buildRecognition(Header param) {
        targetHeaderBits.setRecognition(param.getRecognition());
    }

    private void buildEncryptionType(Header param) {
        targetHeaderBits.setEncryptionType(param.getEncryptionType().getCode());
    }

    private void buildEncoding(Header param) {
        targetHeaderBits.setEncoding(param.getEncoding().getCode());
    }

    private void buildStart(Header param) {
        String startRow = StringTools.intToBinaryString(param.getStartPixel().getX(), Constants.MAX_IMG_SIZE_DIGITS);
        String startCol = StringTools.intToBinaryString(param.getStartPixel().getY(), Constants.MAX_IMG_SIZE_DIGITS);

        targetHeaderBits.setStartRow(startRow);
        targetHeaderBits.setStartCol(startCol);
    }

    private void buildEnd(Header param) {
        String endRow = StringTools.intToBinaryString(param.getEndPixel().getX(), Constants.MAX_IMG_SIZE_DIGITS);
        String endCol = StringTools.intToBinaryString(param.getEndPixel().getY(), Constants.MAX_IMG_SIZE_DIGITS);

        targetHeaderBits.setEndRow(endRow);
        targetHeaderBits.setEndCol(endCol);
    }

    private void buildTimestamp(Header param) {
        // 64bit 时间戳
        String binaryStr = StringTools.longToBinaryString(param.getTime(), Constants.TIMESTAMP_DIGITS);

        targetHeaderBits.setTimestamp(binaryStr);
    }

    private void buildMd5(Header param) {
        targetHeaderBits.setDataMd5(param.getDataMd5());
    }

    private void buildVerifyCode(Header param) {
        targetHeaderBits.setVerifyCode(param.getVerifyCode());
    }

    public void build(Header param) {

        buildRecognition(param);

        buildEncryptionType(param);

        buildEncoding(param);

        buildStart(param);

        buildEnd(param);

        buildTimestamp(param);

        buildMd5(param);

        buildVerifyCode(param);

    }

}
