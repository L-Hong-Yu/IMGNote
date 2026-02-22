package com.imgnote.IMGNoteServer.Entity.param;

import lombok.Data;

@Data
public class WriteParam {

    private String imagePath;

    private String content;

    private Integer encryptionType;

    private String password;

}
