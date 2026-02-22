package com.imgnote.IMGNoteServer.controller.common;

import com.imgnote.IMGNoteServer.Entity.vo.ResponseVo;
import com.imgnote.IMGNoteServer.enums.ResponseCodeEnum;
import com.imgnote.IMGNoteServer.exceptions.BusinessException;

public class BaseController {


    protected static final String STATIC_SUCCESS = "success";
    protected static final String STATIC_ERROR = "error";

    protected <T> ResponseVo<T> getSuccessResponse(T data) {
        ResponseVo<T> response = new ResponseVo<>();
        response.setStatus(STATIC_SUCCESS);
        response.setCode(ResponseCodeEnum.CODE_200.getCode());
        response.setInfo(ResponseCodeEnum.CODE_200.getMsg());
        response.setData(data);
        return response;
    }

    protected <T> ResponseVo<T> getErrorResponse(BusinessException e, T t) {
        ResponseVo<T> vo = new ResponseVo<>();
        vo.setStatus(STATIC_ERROR);
        if (e.getCode() == null) {
            vo.setCode(ResponseCodeEnum.CODE_502.getCode());
        } else {
            vo.setCode(e.getCode());
        }
        vo.setInfo(e.getMessage());
        vo.setData(t);
        return vo;
    }


}
