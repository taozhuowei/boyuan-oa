package com.oa.backend.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.oa.backend.entity.User;
import com.oa.backend.mapper.UserMapper;
import com.oa.backend.service.UserService;
import org.springframework.stereotype.Service;

/**
 * 用户服务实现类 - 提供用户实体的具体业务逻辑
 *
 * 实现说明：
 * 1. 继承ServiceImpl获得MyBatis-Plus提供的完整CRUD实现
 * 2. 使用lambdaQuery构建类型安全的查询条件，避免硬编码字段名
 * 3. 与AccessManagementService不同，本类操作的是数据库中的正式用户数据
 */
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    /**
     * 根据用户名查询单个用户
     * 使用MyBatis-Plus Lambda查询，自动处理SQL构建
     *
     * @param username 要查询的用户名
     * @return 匹配的用户对象，未找到返回null
     */
    @Override
    public User findByUsername(String username) {
        return lambdaQuery().eq(User::getUsername, username).one();
    }

    /**
     * 根据微信用户ID查询单个用户
     * 支持微信登录场景下的用户查找
     *
     * @param wxUserId 微信用户唯一标识
     * @return 匹配的用户对象，未找到返回null
     */
    @Override
    public User findByWxUserId(String wxUserId) {
        return lambdaQuery().eq(User::getWxUserId, wxUserId).one();
    }
}
