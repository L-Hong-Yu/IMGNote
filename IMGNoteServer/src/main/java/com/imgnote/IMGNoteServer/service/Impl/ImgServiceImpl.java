package com.imgnote.IMGNoteServer.service.Impl;

import com.imgnote.IMGNoteServer.Entity.param.ReadParam;
import com.imgnote.IMGNoteServer.Entity.param.WriteParam;
import com.imgnote.IMGNoteServer.cache.CacheManager;
import com.imgnote.IMGNoteServer.ImgProcessor.ImgGen;
import com.imgnote.IMGNoteServer.ImgProcessor.ImgParser;
import com.imgnote.IMGNoteServer.bean.*;
import com.imgnote.IMGNoteServer.converter.HeaderBuilder;
import com.imgnote.IMGNoteServer.enums.EncodeTypeEnum;
import com.imgnote.IMGNoteServer.enums.EncodingEnum;
import com.imgnote.IMGNoteServer.enums.ResponseCodeEnum;
import com.imgnote.IMGNoteServer.exceptions.BusinessException;
import com.imgnote.IMGNoteServer.service.ImgService;
import com.imgnote.IMGNoteServer.utils.StringTools;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class ImgServiceImpl implements ImgService {

    @Override
    public void write(WriteParam param) {
        // 初始化生成对象
        String imagePath = param.getImagePath();
        ImgGen imgGen = new ImgGen(imagePath, imagePath, Constants.FORMAT);

        String text = param.getContent();
        String password = param.getPassword();
        String dataBits = StringTools.stringToBytes(text);
        String dataMd5 = StringTools.getMD5OfString(text);
        String verifyCode = StringTools.getMD5OfString(password);

        EncodeTypeEnum encodeType = EncodeTypeEnum.getByNumber(param.getEncryptionType());
        if (encodeType == null) {
            throw new BusinessException(ResponseCodeEnum.CODE_400);
        }

        // 生成起止点
        imgGen.genStartAndEnd(dataBits);

        // 构建header
        Header header = new Header();
        header.setRecognitionShort(Constants.RECOGNITION);
        header.setEncoding(EncodingEnum.UTF_8);
        header.setEncryptionType(encodeType);
        header.setStartPixel(imgGen.getStartPixel());
        header.setEndPixel(imgGen.getEndPixel());
        header.setTime(System.currentTimeMillis());
        header.setDataMd5(dataMd5);
        header.setVerifyCode(verifyCode);

        // 构建headerBits
        HeaderBits headerBits = new HeaderBits();
        HeaderBuilder builder = new HeaderBuilder(headerBits);
        builder.build(header);

        imgGen.gen(headerBits, header.getStartPixel());

        // 清除缓存
        clearExpiredCacheAsync(imagePath);
    }

    @Override
    public NoteBook read(ReadParam param) {
        // 查询缓存
        String imageMd5 = StringTools.getFileMD5(param.getImagePath());
        if (CacheManager.exists(imageMd5)) {
            CacheManager.CacheEntry cachedEntry = CacheManager.get(imageMd5);
            if (cachedEntry != null) {
                log.info("命中缓存，图片MD5: {}", imageMd5);
                return cachedEntry.getNoteBook();
            }
        }

        Header resultHeader = new Header();
        ImgParser imgParser = new ImgParser(param.getImagePath(), resultHeader);

        // 获取图像基本信息
        Img img = imgParser.getImg();

        short recognition = resultHeader.getRecognitionShort();
        if (recognition != Constants.RECOGNITION) {
            log.warn("Result header recognition:  {}", StringTools.bytesToString(resultHeader.getRecognition()));
            throw new BusinessException(ResponseCodeEnum.CODE_406, new NoteBook(img));
        }

        // 获取二进制数据
        String resultDataBits = imgParser.getDataBits();

        // 获取明文数据
        String resultText = StringTools.bytesToString(resultDataBits);

        NoteBook resultNoteBook = new NoteBook(resultHeader, resultText, img);

        // 添加缓存
        addCacheAsync(imageMd5, resultNoteBook);

        return resultNoteBook;
    }

    /**
     * 异步写入缓存
     */
    private void addCacheAsync(String imageMd5, NoteBook resultNoteBook) {
        new Thread(() -> {
            try {
                CacheManager.put(imageMd5 ,resultNoteBook);
            } catch (Exception e) {
                log.warn("异步写入缓存时发生异常: {}", e.getMessage());
            }
        }, "Cache-Add-Thread").start();
    }

    /**
     * 异步清除过期缓存
     */
    private void clearExpiredCacheAsync(String imagePath) {
        new Thread(() -> {
            try {
                String imageMd5 = StringTools.getFileMD5(imagePath);
                CacheManager.remove(imageMd5);
            } catch (Exception e) {
                log.warn("异步清理缓存时发生异常: {}", e.getMessage());
            }
        }, "Cache-Cleanup-Thread").start();
    }
}
