package com.imgnote.IMGNoteServer.enums;

import lombok.Getter;

@Getter
public enum ResponseCodeEnum {

    CODE_200(200, "请求成功"),
    CODE_400(400, "请求参数错误"),
    CODE_401(401, "需要密码"),
    CODE_402(402, "密码错误"),
    CODE_403(403, "操作无权限"),
    CODE_404(404, "目标资源不存在"),
    CODE_405(405, "目标资源已存在"),
    CODE_406(406, "Header标识错误"),
    CODE_410(410, "图片文件数据损坏"),
    CODE_411(411, "图片文件解析失败"),
    CODE_412(412, "图片文件保存失败"),
    CODE_501(501, "业务逻辑错误"),
    CODE_512(512, "数据转换异常"),
    CODE_502(502, "系统错误"),
    CODE_503(503, "系统异常"),
    CODE_600(600, "未知错误");

    private final Integer code;

    private final String msg;

    ResponseCodeEnum(Integer code, String msg) {
        this.code = code;
        this.msg = msg;
    }

}
