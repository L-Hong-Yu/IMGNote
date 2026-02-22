package com.imgnote.IMGNoteServer.enums;

import lombok.Getter;

@Getter
public enum EncodeTypeEnum {

    NONE("0000", "无加密", 0),
    WEAK("0001", "弱加密", 1),
    STRONG("0010", "强加密", 2),
    ;

    private final String code;

    private final String type;

    private final Integer number;

    EncodeTypeEnum(String code, String type, Integer number) {
        this.code = code;
        this.type = type;
        this.number = number;
    }

    public static EncodeTypeEnum getByCode(String code) {
        for (EncodeTypeEnum value : values()) {
            if (value.code.equals(code)) {
                return value;
            }
        }
        return null;
    }

    public static EncodeTypeEnum getByNumber(Integer number) {
        for (EncodeTypeEnum value : values()) {
            if (value.number.equals(number)) {
                return value;
            }
        }
        return null;
    }

}
