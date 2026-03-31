package com.oa.backend.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.oa.backend.entity.User;

/**
 * 用户服务接口 - 定义用户实体相关的业务操作
 *
 * 说明：
 * 1. 继承MyBatis-Plus的IService接口，自动获得基础的CRUD能力
 * 2. 扩展支持按用户名查询和按微信用户ID查询的功能
 * 3. 用于处理数据库中持久化的正式用户数据（与演示账号分离）
 */
public interface UserService extends IService<User> {

    /**
     * 根据用户名查找用户
     * @param username 用户名（唯一标识）
     * @return 用户实体，不存在时返回null
     */
    User findByUsername(String username);

    /**
     * 根据微信用户ID查找用户
     * @param wxUserId 微信开放平台用户标识
     * @return 用户实体，不存在时返回null
     */
    User findByWxUserId(String wxUserId);
}
