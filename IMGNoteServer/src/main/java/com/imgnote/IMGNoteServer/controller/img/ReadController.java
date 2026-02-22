package com.imgnote.IMGNoteServer.controller.img;

import com.imgnote.IMGNoteServer.Entity.param.ReadParam;
import com.imgnote.IMGNoteServer.Entity.vo.ResponseVo;
import com.imgnote.IMGNoteServer.bean.NoteBook;
import com.imgnote.IMGNoteServer.controller.common.BaseController;
import com.imgnote.IMGNoteServer.service.ImgService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@Validated
@RestController
@RequestMapping("/notebook")
public class ReadController extends BaseController {

    @Autowired
    private ImgService imgService;

    @RequestMapping("/read")
    public ResponseVo read(ReadParam param) {
        log.info("read request, param: {}", param);

        NoteBook result = imgService.read(param);
        return getSuccessResponse(result);
    }

}
