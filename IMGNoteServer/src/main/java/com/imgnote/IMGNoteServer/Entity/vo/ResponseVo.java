package com.imgnote.IMGNoteServer.Entity.vo;

import lombok.Data;

@Data
public class ResponseVo<T> {

    private String status;
    private Integer code;
    private String info;
    private T data;

}
