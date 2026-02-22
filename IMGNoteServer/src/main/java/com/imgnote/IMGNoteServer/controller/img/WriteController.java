package com.imgnote.IMGNoteServer.controller.img;

import com.imgnote.IMGNoteServer.Entity.param.WriteParam;
import com.imgnote.IMGNoteServer.Entity.vo.ResponseVo;
import com.imgnote.IMGNoteServer.controller.common.BaseController;
import com.imgnote.IMGNoteServer.service.ImgService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@Validated
@RestController
@RequestMapping("/notebook")
public class WriteController extends BaseController {

    @Autowired
    private ImgService writeService;

    @RequestMapping("/write")
    public ResponseVo write(@RequestBody WriteParam param) {
        log.info(param.getContent().replace("\n", "\\n").replace("\r", "\\r"));
        log.info("write request, param: {}", param);
        writeService.write(param);

        return getSuccessResponse(null);
    }

}
