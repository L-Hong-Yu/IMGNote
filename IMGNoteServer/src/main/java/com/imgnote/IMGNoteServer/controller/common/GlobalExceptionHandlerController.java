package com.imgnote.IMGNoteServer.controller.common;

import com.imgnote.IMGNoteServer.Entity.vo.ResponseVo;
import com.imgnote.IMGNoteServer.enums.ResponseCodeEnum;
import com.imgnote.IMGNoteServer.exceptions.BusinessException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.net.BindException;

@RestControllerAdvice
public class GlobalExceptionHandlerController extends BaseController {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandlerController.class);

    @ExceptionHandler(value = Exception.class)
    Object handleException(Exception e, HttpServletRequest request) {
        logger.error("请求错误, URL: {}, 错误信息: {}", request.getRequestURI(), e.getMessage());
        ResponseVo ajaxResponse = new ResponseVo();

        if (e instanceof NoHandlerFoundException) {
            ajaxResponse.setCode(ResponseCodeEnum.CODE_404.getCode());
            ajaxResponse.setInfo(ResponseCodeEnum.CODE_404.getMsg());
            ajaxResponse.setStatus(STATIC_ERROR);
        } else if (e instanceof BusinessException) {
            // 业务错误
            BusinessException businessException = (BusinessException) e;
            ajaxResponse.setCode(businessException.getCode());
            ajaxResponse.setInfo(businessException.getMessage());
            if (businessException.getData() != null) {
                ajaxResponse.setData(businessException.getData());
            }
            ajaxResponse.setStatus(STATIC_ERROR);
        } else if (e instanceof BindException) {
            // 参数错误
            ajaxResponse.setCode(ResponseCodeEnum.CODE_400.getCode());
            ajaxResponse.setInfo(ResponseCodeEnum.CODE_400.getMsg());
            ajaxResponse.setStatus(STATIC_ERROR);
        } else if (e instanceof NumberFormatException) {
            // 数据解析错误
            ajaxResponse.setCode(ResponseCodeEnum.CODE_410.getCode());
            ajaxResponse.setInfo(ResponseCodeEnum.CODE_410.getMsg());
            ajaxResponse.setStatus(STATIC_ERROR);
        }else {
            // 其他错误
            ajaxResponse.setCode(ResponseCodeEnum.CODE_600.getCode());
            ajaxResponse.setInfo(ResponseCodeEnum.CODE_600.getMsg());
            ajaxResponse.setStatus(STATIC_ERROR);
        }

        return ajaxResponse;
    }


}
