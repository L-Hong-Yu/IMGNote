package com.imgnote.IMGNoteServer.service;

import com.imgnote.IMGNoteServer.Entity.param.ReadParam;
import com.imgnote.IMGNoteServer.Entity.param.WriteParam;
import com.imgnote.IMGNoteServer.bean.NoteBook;

public interface ImgService {

    void write(WriteParam param);

    NoteBook read(ReadParam param);

}
