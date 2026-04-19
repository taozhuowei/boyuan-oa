package com.oa.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

import com.oa.backend.dto.ProjectCreateRequest;
import com.oa.backend.dto.ProjectMemberRequest;
import com.oa.backend.dto.ProjectUpdateRequest;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.Project;
import com.oa.backend.entity.ProjectMember;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.mapper.ProjectMapper;
import com.oa.backend.mapper.ProjectMemberMapper;
import com.oa.backend.service.impl.ProjectServiceImpl;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/** ProjectServiceImpl 单元测试 覆盖：创建项目、状态变更、添加成员、不将 pmId 写入 project 表 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("M2 - ProjectServiceImpl")
class ProjectServiceImplTest {

  @InjectMocks private ProjectServiceImpl service;

  @Mock private ProjectMapper projectMapper;

  @Mock private ProjectMemberMapper projectMemberMapper;

  @Mock private EmployeeMapper employeeMapper;

  // ─── create ──────────────────────────────────────────────

  @Test
  @DisplayName("create：新项目 status=ACTIVE，logCycleDays 默认 1")
  void create_normal_setsActiveStatus() {
    when(projectMapper.insert(any())).thenReturn(1);
    ProjectCreateRequest req =
        new ProjectCreateRequest("测试项目", LocalDate.now(), null, null, null, null, null);

    Project result = service.create(req);

    assertEquals("ACTIVE", result.getStatus());
    assertEquals(1, result.getLogCycleDays());
    assertEquals("测试项目", result.getName());
    assertNotNull(result.getCreatedAt());
    assertEquals(0, result.getDeleted());
  }

  @Test
  @DisplayName("create：logCycleDays 传入时使用传入值")
  void create_withLogCycleDays_usesProvidedValue() {
    when(projectMapper.insert(any())).thenReturn(1);
    ProjectCreateRequest req = new ProjectCreateRequest("项目B", null, 7, null, null, null, null);

    Project result = service.create(req);

    assertEquals(7, result.getLogCycleDays());
  }

  // ─── getById ─────────────────────────────────────────────

  @Test
  @DisplayName("getById：项目不存在（mapper 返回 null）时返回 null")
  void getById_notFound_returnsNull() {
    when(projectMapper.selectOne(any())).thenReturn(null);
    assertNull(service.getById(99L));
  }

  // ─── closeProject / reopenProject ────────────────────────

  @Test
  @DisplayName("closeProject：status 变为 CLOSED，actualEndDate 被设置")
  void closeProject_setsClosedStatus() {
    Project project = activeProject(1L);
    when(projectMapper.selectOne(any())).thenReturn(project);

    service.closeProject(1L);

    ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
    verify(projectMapper).updateById(captor.capture());
    assertEquals("CLOSED", captor.getValue().getStatus());
    assertNotNull(captor.getValue().getActualEndDate());
  }

  @Test
  @DisplayName("reopenProject：status 变为 ACTIVE")
  void reopenProject_setsActiveStatus() {
    Project project = activeProject(1L);
    project.setStatus("CLOSED");
    when(projectMapper.selectOne(any())).thenReturn(project);

    service.reopenProject(1L);

    ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
    verify(projectMapper).updateById(captor.capture());
    assertEquals("ACTIVE", captor.getValue().getStatus());
  }

  @Test
  @DisplayName("closeProject：项目不存在时抛出 IllegalArgumentException")
  void closeProject_notFound_throwsException() {
    when(projectMapper.selectOne(any())).thenReturn(null);
    assertThrows(IllegalArgumentException.class, () -> service.closeProject(99L));
  }

  // ─── delete ──────────────────────────────────────────────

  @Test
  @DisplayName("delete：软删除，设置 deleted=1")
  void delete_softDeletesProject() {
    Project project = activeProject(1L);
    when(projectMapper.selectOne(any())).thenReturn(project);

    service.delete(1L);

    ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
    verify(projectMapper).updateById(captor.capture());
    assertEquals(1, captor.getValue().getDeleted());
  }

  // ─── addMember ───────────────────────────────────────────

  @Test
  @DisplayName("addMember：新成员正常插入，role=PM 不写 pmId 到 project 表")
  void addMember_pm_insertsWithoutWritingPmIdToProject() {
    when(projectMapper.selectOne(any())).thenReturn(activeProject(1L));
    when(employeeMapper.selectById(3L)).thenReturn(employee(3L));
    when(projectMemberMapper.selectOne(any())).thenReturn(null); // 无重复
    when(projectMemberMapper.insert(any())).thenReturn(1);

    ProjectMemberRequest req = new ProjectMemberRequest(3L, "PM");
    ProjectMember result = service.addMember(1L, req);

    assertEquals("PM", result.getRole());
    assertEquals(1L, result.getProjectId());
    assertEquals(3L, result.getEmployeeId());
    // project 表不应被 update（不写 pmId）
    verify(projectMapper, never()).updateById(any());
  }

  @Test
  @DisplayName("addMember：已存在且未删除的成员，抛出 IllegalArgumentException")
  void addMember_duplicateActive_throwsException() {
    when(projectMapper.selectOne(any())).thenReturn(activeProject(1L));
    when(employeeMapper.selectById(3L)).thenReturn(employee(3L));
    ProjectMember existing = new ProjectMember();
    existing.setDeleted(0);
    when(projectMemberMapper.selectOne(any())).thenReturn(existing);

    assertThrows(
        IllegalArgumentException.class,
        () -> service.addMember(1L, new ProjectMemberRequest(3L, "MEMBER")));
  }

  @Test
  @DisplayName("addMember：软删除成员重新添加时恢复，不重复插入")
  void addMember_softDeletedMember_restoresWithoutInsert() {
    when(projectMapper.selectOne(any())).thenReturn(activeProject(1L));
    when(employeeMapper.selectById(3L)).thenReturn(employee(3L));
    ProjectMember softDeleted = new ProjectMember();
    softDeleted.setDeleted(1);
    softDeleted.setRole("MEMBER");
    when(projectMemberMapper.selectOne(any())).thenReturn(softDeleted);

    service.addMember(1L, new ProjectMemberRequest(3L, "PM"));

    verify(projectMemberMapper, never()).insert(any());
    verify(projectMemberMapper).updateById(any());
  }

  @Test
  @DisplayName("addMember：员工不存在时抛出 IllegalArgumentException")
  void addMember_employeeNotFound_throwsException() {
    when(projectMapper.selectOne(any())).thenReturn(activeProject(1L));
    when(employeeMapper.selectById(99L)).thenReturn(null);

    assertThrows(
        IllegalArgumentException.class,
        () -> service.addMember(1L, new ProjectMemberRequest(99L, "MEMBER")));
  }

  // ─── getById additional tests ──────────────────────────

  @Test
  @DisplayName("getById：项目存在时返回项目")
  void getById_found_returnsProject() {
    Project project = activeProject(1L);
    when(projectMapper.selectOne(any())).thenReturn(project);

    Project result = service.getById(1L);

    assertNotNull(result);
    assertEquals(1L, result.getId());
    assertEquals("测试项目", result.getName());
  }

  // ─── getMembers ──────────────────────────────────────────

  @Test
  @DisplayName("getMembers：返回项目成员列表")
  void getMembers_returnsMemberList() {
    ProjectMember member1 = new ProjectMember();
    member1.setId(1L);
    member1.setProjectId(1L);
    member1.setEmployeeId(101L);
    member1.setRole("PM");

    ProjectMember member2 = new ProjectMember();
    member2.setId(2L);
    member2.setProjectId(1L);
    member2.setEmployeeId(102L);
    member2.setRole("MEMBER");

    when(projectMemberMapper.selectList(any())).thenReturn(List.of(member1, member2));

    List<ProjectMember> result = service.getMembers(1L);

    assertEquals(2, result.size());
    assertEquals("PM", result.get(0).getRole());
    assertEquals("MEMBER", result.get(1).getRole());
  }

  // ─── create success path ─────────────────────────────────

  @Test
  @DisplayName("create：成功创建项目，insert返回1，状态为ACTIVE")
  void create_success_returnsProjectWithActiveStatus() {
    when(projectMapper.insert(any())).thenReturn(1);
    ProjectCreateRequest req =
        new ProjectCreateRequest("新项目", LocalDate.now(), 5, null, null, null, null);

    Project result = service.create(req);

    assertNotNull(result);
    assertEquals("ACTIVE", result.getStatus());
    assertEquals("新项目", result.getName());
    assertEquals(5, result.getLogCycleDays());
  }

  // ─── update ──────────────────────────────────────────────

  @Test
  @DisplayName("update：项目不存在时抛出 IllegalArgumentException")
  void update_notFound_throwsException() {
    when(projectMapper.selectOne(any())).thenReturn(null);
    ProjectUpdateRequest req =
        new ProjectUpdateRequest("新名称", null, null, null, null, null, null, null, null);

    assertThrows(IllegalArgumentException.class, () -> service.update(99L, req));
  }

  @Test
  @DisplayName("update：成功更新项目字段，调用updateById")
  void update_success_updatesFieldsAndCallsUpdateById() {
    Project project = activeProject(1L);
    when(projectMapper.selectOne(any())).thenReturn(project);

    ProjectUpdateRequest req =
        new ProjectUpdateRequest(
            "更新后名称",
            LocalDate.of(2024, 1, 1),
            LocalDate.of(2024, 12, 31),
            7,
            3,
            null,
            null,
            null,
            null);

    service.update(1L, req);

    ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
    verify(projectMapper).updateById(captor.capture());
    Project updated = captor.getValue();
    assertEquals("更新后名称", updated.getName());
    assertEquals(LocalDate.of(2024, 1, 1), updated.getStartDate());
    assertEquals(LocalDate.of(2024, 12, 31), updated.getActualEndDate());
    assertEquals(7, updated.getLogCycleDays());
    assertEquals(3, updated.getLogReportCycleDays());
  }

  // ─── closeProject additional tests ───────────────────────

  @Test
  @DisplayName("closeProject：成功关闭项目，调用updateById设置status=CLOSED")
  void closeProject_success_callsUpdateByIdWithClosedStatus() {
    Project project = activeProject(1L);
    when(projectMapper.selectOne(any())).thenReturn(project);

    service.closeProject(1L);

    ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
    verify(projectMapper).updateById(captor.capture());
    assertEquals("CLOSED", captor.getValue().getStatus());
    assertNotNull(captor.getValue().getActualEndDate());
  }

  // ─── reopenProject additional tests ──────────────────────

  @Test
  @DisplayName("reopenProject：项目不存在时抛出 IllegalArgumentException")
  void reopenProject_notFound_throwsException() {
    when(projectMapper.selectOne(any())).thenReturn(null);
    assertThrows(IllegalArgumentException.class, () -> service.reopenProject(99L));
  }

  @Test
  @DisplayName("reopenProject：成功重启项目，调用updateById设置status=ACTIVE")
  void reopenProject_success_callsUpdateByIdWithActiveStatus() {
    Project project = activeProject(1L);
    project.setStatus("CLOSED");
    when(projectMapper.selectOne(any())).thenReturn(project);

    service.reopenProject(1L);

    ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
    verify(projectMapper).updateById(captor.capture());
    assertEquals("ACTIVE", captor.getValue().getStatus());
  }

  // ─── delete additional tests ─────────────────────────────

  @Test
  @DisplayName("delete：项目不存在时抛出 IllegalArgumentException")
  void delete_notFound_throwsException() {
    when(projectMapper.selectOne(any())).thenReturn(null);
    assertThrows(IllegalArgumentException.class, () -> service.delete(99L));
  }

  @Test
  @DisplayName("delete：成功删除项目，调用updateById设置deleted=1")
  void delete_success_callsUpdateByIdWithDeletedFlag() {
    Project project = activeProject(1L);
    when(projectMapper.selectOne(any())).thenReturn(project);

    service.delete(1L);

    ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
    verify(projectMapper).updateById(captor.capture());
    assertEquals(1, captor.getValue().getDeleted());
  }

  // ─── addMember additional tests ──────────────────────────

  @Test
  @DisplayName("addMember：项目不存在时抛出 IllegalArgumentException")
  void addMember_projectNotFound_throwsException() {
    when(projectMapper.selectOne(any())).thenReturn(null);

    assertThrows(
        IllegalArgumentException.class,
        () -> service.addMember(99L, new ProjectMemberRequest(3L, "MEMBER")));
  }

  @Test
  @DisplayName("addMember：成功添加新成员，执行insert操作")
  void addMember_success_insertsNewMember() {
    when(projectMapper.selectOne(any())).thenReturn(activeProject(1L));
    when(employeeMapper.selectById(3L)).thenReturn(employee(3L));
    when(projectMemberMapper.selectOne(any())).thenReturn(null);
    when(projectMemberMapper.insert(any())).thenReturn(1);

    ProjectMemberRequest req = new ProjectMemberRequest(3L, "MEMBER");
    ProjectMember result = service.addMember(1L, req);

    assertNotNull(result);
    assertEquals(1L, result.getProjectId());
    assertEquals(3L, result.getEmployeeId());
    assertEquals("MEMBER", result.getRole());
    verify(projectMemberMapper).insert(any());
  }

  // ─── removeMember ─────────────────────────────────────────

  @Test
  @DisplayName("removeMember：成员不存在时抛出 IllegalArgumentException")
  void removeMember_notFound_throwsException() {
    when(projectMemberMapper.selectOne(any())).thenReturn(null);
    assertThrows(IllegalArgumentException.class, () -> service.removeMember(1L, 3L));
  }

  @Test
  @DisplayName("removeMember：成功软删除成员，设置 deleted=1")
  void removeMember_success_softDeletesMember() {
    ProjectMember member = new ProjectMember();
    member.setId(1L);
    member.setDeleted(0);
    when(projectMemberMapper.selectOne(any())).thenReturn(member);

    service.removeMember(1L, 3L);

    verify(projectMemberMapper).updateById(argThat(m -> m.getDeleted() == 1));
  }

  // ─── listProjects with pmEmployeeId filter ─────────────────

  @Test
  @DisplayName("listProjects：传入 pmEmployeeId 时过滤 PM 项目，无项目时返回空分页")
  void listProjects_withPmFilter_noProjects_returnsEmptyPage() {
    when(projectMemberMapper.selectList(any())).thenReturn(List.of());

    var result = service.listProjects(1, 10, null, 5L);

    assertNotNull(result);
    assertEquals(0, result.getTotal());
    verify(projectMapper, never()).selectPage(any(), any());
  }

  // ─── helpers ─────────────────────────────────────────────

  private Project activeProject(Long id) {
    Project p = new Project();
    p.setId(id);
    p.setName("测试项目");
    p.setStatus("ACTIVE");
    p.setDeleted(0);
    return p;
  }

  private Employee employee(Long id) {
    Employee e = new Employee();
    e.setId(id);
    e.setName("测试员工");
    return e;
  }
}
