package com.imgnote.IMGNoteServer.bean;

import com.imgnote.IMGNoteServer.utils.StringTools;
import lombok.Data;

@Data
public class NoteBook {

    private Header header;

    private String data;

    private Boolean isDataComplete;

    private Img img;

    public NoteBook(Header header, String data, Img img) {
        this.header = header;
        this.data = data;
        this.img = img;
        this.isDataComplete = StringTools.getMD5OfString(data).equals(header.getDataMd5());
    }

    public NoteBook(Img img) {
        this.img = img;
    }

}
