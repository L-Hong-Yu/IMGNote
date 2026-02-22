package com.imgnote.IMGNoteServer.bean;

public class Constants {

    public static final short RECOGNITION = 0x5354;

    public static final int RECOGNITION_LENGTH = 16;

    public static final int MAX_IMG_SIZE_DIGITS = 14;

    public static final int MAX_IMG_SIZE_INT = (1 << MAX_IMG_SIZE_DIGITS) - 1;

    public static final int TIMESTAMP_DIGITS = 64;

    public static final int ENCRYPTION_TYPE_LENGTH = 4;

    public static final int ENCODING_LENGTH = 2;

    public static final int START_ROW_LENGTH = MAX_IMG_SIZE_DIGITS;

    public static final int START_COL_LENGTH = MAX_IMG_SIZE_DIGITS;

    public static final int END_ROW_LENGTH = 14;

    public static final int END_COL_LENGTH = 14;

    public static final int TIMESTAMP_LENGTH = 64;

    public static final int MD5_LENGTH = 128;

    public static final int VERIFY_CODE_LENGTH = 128;

    public static final int HEADER_LENGTH = RECOGNITION_LENGTH + ENCRYPTION_TYPE_LENGTH + ENCODING_LENGTH + START_ROW_LENGTH + START_COL_LENGTH + END_ROW_LENGTH + END_COL_LENGTH + TIMESTAMP_LENGTH + MD5_LENGTH + VERIFY_CODE_LENGTH;

    public static final String FORMAT = "png";

}
