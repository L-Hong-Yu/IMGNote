package com.imgnote.IMGNoteServer.enums;

import lombok.Getter;

@Getter
public enum EncodingEnum {

    UTF_8("00", "UTF-8"),
    GBK("01", "GBK"),
    ;

    private final String code;

    private final String type;

    EncodingEnum(String code, String type) {
        this.code = code;
        this.type = type;
    }

    public static EncodingEnum getByCode(String code) {
        for (EncodingEnum value : values()) {
            if (value.code.equals(code)) {
                return value;
            }
        }
        return null;
    }

}
