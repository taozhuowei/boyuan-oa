package com.oa.backend.controller;

import com.oa.backend.entity.User;
import com.oa.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 用户管理控制器
 * 负责用户的增删改查等基础数据管理操作
 */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * 职责：获取系统中所有用户的列表
     * 请求含义：查询所有用户的基本信息
     * 响应含义：返回用户实体对象列表
     * 权限期望：需要已认证用户访问
     */
    @GetMapping
    public ResponseEntity<List<User>> list() {
        return ResponseEntity.ok(userService.list());
    }

    /**
     * 职责：根据ID获取指定用户的详细信息
     * 请求含义：通过路径参数传递用户ID查询特定用户
     * 响应含义：返回指定ID的用户实体对象
     * 权限期望：需要已认证用户访问
     */
    @GetMapping("/{id}")
    public ResponseEntity<User> getById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getById(id));
    }

    /**
     * 职责：创建新用户
     * 请求含义：提交用户实体对象进行新增操作
     * 响应含义：返回操作是否成功的布尔值
     * 权限期望：需要具有用户管理权限的已认证用户访问
     */
    @PostMapping
    public ResponseEntity<Boolean> save(@RequestBody User user) {
        return ResponseEntity.ok(userService.save(user));
    }

    /**
     * 职责：更新指定用户的信息
     * 请求含义：通过路径参数传递用户ID，并提交更新后的用户实体对象
     * 响应含义：返回操作是否成功的布尔值
     * 权限期望：需要具有用户管理权限的已认证用户访问
     */
    @PutMapping("/{id}")
    public ResponseEntity<Boolean> update(@PathVariable Long id, @RequestBody User user) {
        user.setId(id);
        return ResponseEntity.ok(userService.updateById(user));
    }

    /**
     * 职责：删除指定用户
     * 请求含义：通过路径参数传递用户ID进行删除操作
     * 响应含义：返回操作是否成功的布尔值
     * 权限期望：需要具有用户管理权限的已认证用户访问
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Boolean> delete(@PathVariable Long id) {
        return ResponseEntity.ok(userService.removeById(id));
    }
}
