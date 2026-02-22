package com.imgnote.IMGNoteServer.exceptions;

import com.imgnote.IMGNoteServer.enums.ResponseCodeEnum;
import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException{

    private ResponseCodeEnum codeEnum;

    private Integer code;

    private String message;

    private Object data;

    public BusinessException(String message, Throwable e) {
        super(message, e);
        this.message = message;
    }

    public BusinessException(String message) {
        super(message);
        this.message = message;
    }

    public BusinessException(Throwable e) {
        super(e);
    }

    public BusinessException(ResponseCodeEnum codeEnum) {
        super(codeEnum.getMsg());
        this.codeEnum = codeEnum;
        this.code = codeEnum.getCode();
        this.message = codeEnum.getMsg();
    }

    public BusinessException(ResponseCodeEnum codeEnum, Object data) {
        super(codeEnum.getMsg());
        this.codeEnum = codeEnum;
        this.code = codeEnum.getCode();
        this.message = codeEnum.getMsg();
        this.data = data;
    }

    public BusinessException(Integer code, String message) {
        super(message);
        this.code = code;
        this.message = message;
    }

    @Override
    public Throwable fillInStackTrace() {
        return this;
    }

}
