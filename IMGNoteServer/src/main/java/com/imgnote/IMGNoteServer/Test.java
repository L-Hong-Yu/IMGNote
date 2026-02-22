package com.imgnote.IMGNoteServer;

import com.imgnote.IMGNoteServer.ImgProcessor.ImgGen;
import com.imgnote.IMGNoteServer.ImgProcessor.ImgParser;
import com.imgnote.IMGNoteServer.bean.*;
import com.imgnote.IMGNoteServer.enums.EncodeTypeEnum;
import com.imgnote.IMGNoteServer.enums.EncodingEnum;
import com.imgnote.IMGNoteServer.converter.HeaderBuilder;
import lombok.extern.slf4j.Slf4j;
import com.imgnote.IMGNoteServer.utils.StringTools;

@Slf4j
public class Test {

    public static void main(String[] args) {

        String originPath = "test2.png";
        String outputPath = "test1.png";
        String format = "png";

        String text = "hello world";
        String verifyText = "verifyCode";

        String md5Bits = StringTools.getMD5OfString(text);
        String verifyCode = StringTools.getMD5OfString(verifyText);
        String dataBits = StringTools.stringToBytes(text);

        log.info("dataBits: {}", dataBits);
        log.info("dataBits length: {}", dataBits.length());

        ImgGen imgGen = new ImgGen(originPath, outputPath, format);
        imgGen.genStartAndEnd(dataBits);

        Header param = new Header();
        param.setRecognitionShort(Constants.RECOGNITION);
        param.setEncoding(EncodingEnum.UTF_8);
        param.setEncryptionType(EncodeTypeEnum.NONE);
        param.setStartPixel(imgGen.getStartPixel());
        param.setEndPixel(imgGen.getEndPixel());
        param.setTime(System.currentTimeMillis());
        param.setDataMd5(md5Bits);
        param.setVerifyCode(verifyCode);

        HeaderBits headerBits = new HeaderBits();
        HeaderBuilder builder = new HeaderBuilder(headerBits);
        builder.build(param);

        log.info("Header bits: {}", headerBits);
        log.info("Header bits length: {}", headerBits.toString().length());

//        Header res = new Header();
//        HeaderParser parser = new HeaderParser(res, headerBits.toString());
//        parser.parse();
//        log.info("Header: {}", res);
//        log.info("Header recognition == Origin: {}", res.getRecognition().equals(param.getRecognition()));
//        log.info("Header md5 == Origin: {}", res.getMd5().equals(md5Bits));
//        log.info("Header verifyCode == Origin: {}", res.getVerifyCode().equals(verifyCode));
//        log.info("Header recognition:  {}", StringTools.bytesToString(res.getRecognition()));

        imgGen.gen(headerBits, param.getStartPixel());

        Header resultHeader = new Header();
        ImgParser imgParser = new ImgParser(outputPath, resultHeader);
        log.info("Result header: {}", resultHeader);
        log.info("Result header recognition:  {}", StringTools.bytesToString(resultHeader.getRecognition()));
        log.info("Result header recognition == Constants: {}", resultHeader.getRecognitionShort() == Constants.RECOGNITION);
        log.info("Result header == Origin: {}", resultHeader.equals(param));

        String resultDataBits = imgParser.getDataBits();
        log.info("Result data bits: {}", resultDataBits);
        log.info("Result data bits length: {}", resultDataBits.length());
        log.info("Result data bits == Origin: {}", resultDataBits.equals(dataBits));
        String resultText = StringTools.bytesToString(resultDataBits);
        log.info("Result text: {}", resultText);
        log.info("Result text == Origin: {}", resultText.equals(text));
    }

}
