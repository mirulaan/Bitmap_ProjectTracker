import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useProject } from "../state/ProjectProvider";
import { uid } from "../lib/project";
import type { Group, Phase, User } from "../types";
import { Button, Card, Field, Input, Select } from "./ui";

export default function SetupView() {
  const {
    project,
    updateProject,
    updateSettings,
    upsertPhase,
    deletePhase,
    upsertGroup,
    deleteGroup,
    upsertUser,
    deleteUser,
  } = useProject();

  const [newUser, setNewUser] = useState({
    name: "",
    role: "",
    groupId: project.groups[0]?.id || "",
    email: "",
  });

  const phasesSorted = [...project.phases].sort((a, b) => a.order - b.order);

  const addPhase = () => {
    const maxOrder = Math.max(0, ...project.phases.map((p) => p.order));

    upsertPhase({
      id: uid("phase"),
      name: `New Phase ${maxOrder + 1}`,
      description: "",
      order: maxOrder + 1,
    });
  };

  const addGroup = () => {
    upsertGroup({
      id: uid("group"),
      name: "New Group",
    });
  };

  const addUser = () => {
    if (!newUser.name.trim()) {
      alert("User name is required.");
      return;
    }

    const user: User = {
      id: uid("user"),
      name: newUser.name.trim(),
      role: newUser.role.trim(),
      groupId: newUser.groupId,
      email: newUser.email.trim(),
      active: true,
    };

    upsertUser(user);

    setNewUser({
      name: "",
      role: "",
      groupId: project.groups[0]?.id || "",
      email: "",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h2 className="mb-4 text-lg font-semibold">Project Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Field label="Project Name">
            <Input
              value={project.name}
              onChange={(e) => updateProject({ name: e.target.value })}
            />
          </Field>

          <Field label="Customer">
            <Input
              value={project.customer}
              onChange={(e) => updateProject({ customer: e.target.value })}
            />
          </Field>

          <Field label="Project Manager / Coordinator">
            <Input
              value={project.projectManager}
              onChange={(e) =>
                updateProject({ projectManager: e.target.value })
              }
            />
          </Field>

          <Field label="Project Start Date">
            <Input
              type="date"
              value={project.startDate}
              onChange={(e) => updateProject({ startDate: e.target.value })}
            />
          </Field>

          <Field label="Project End Date">
            <Input
              type="date"
              value={project.endDate}
              onChange={(e) => updateProject({ endDate: e.target.value })}
            />
          </Field>

          <Field label="Auto-save">
            <label className="flex h-[38px] items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm">
              <input
                type="checkbox"
                checked={project.settings.autoSave}
                onChange={(e) =>
                  updateSettings({ autoSave: e.target.checked })
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Enable auto-save to connected folder
            </label>
          </Field>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Automation Lifecycle Phases</h2>

          <Button size="sm" onClick={addPhase}>
            <Plus className="h-4 w-4" />
            Add Phase
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3">Order</th>
                <th className="py-2 pr-3">Phase Name</th>
                <th className="py-2 pr-3">Description</th>
                <th className="py-2 pr-3">Start</th>
                <th className="py-2 pr-3">Due</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {phasesSorted.map((phase) => (
                <tr key={phase.id} className="border-b border-slate-100">
                  <td className="py-2 pr-3 w-20">
                    <Input
                      type="number"
                      value={phase.order}
                      onChange={(e) =>
                        upsertPhase({
                          ...phase,
                          order: Number(e.target.value),
                        })
                      }
                    />
                  </td>

                  <td className="py-2 pr-3">
                    <Input
                      value={phase.name}
                      onChange={(e) =>
                        upsertPhase({ ...phase, name: e.target.value })
                      }
                    />
                  </td>

                  <td className="py-2 pr-3">
                    <Input
                      value={phase.description}
                      onChange={(e) =>
                        upsertPhase({
                          ...phase,
                          description: e.target.value,
                        })
                      }
                    />
                  </td>

                  <td className="py-2 pr-3 w-40">
                    <Input
                      type="date"
                      value={phase.startDate || ""}
                      onChange={(e) =>
                        upsertPhase({
                          ...phase,
                          startDate: e.target.value || undefined,
                        })
                      }
                    />
                  </td>

                  <td className="py-2 pr-3 w-40">
                    <Input
                      type="date"
                      value={phase.dueDate || ""}
                      onChange={(e) =>
                        upsertPhase({
                          ...phase,
                          dueDate: e.target.value || undefined,
                        })
                      }
                    />
                  </td>

                  <td className="py-2 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deletePhase(phase.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Groups / Departments</h2>

          <Button size="sm" onClick={addGroup}>
            <Plus className="h-4 w-4" />
            Add Group
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {project.groups.map((group: Group) => (
            <div
              key={group.id}
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-white p-2"
            >
              <Input
                value={group.name}
                onChange={(e) =>
                  upsertGroup({ ...group, name: e.target.value })
                }
              />

              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteGroup(group.id)}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="mb-4 text-lg font-semibold">Team Members</h2>

        <div className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <Field label="Name">
            <Input
              value={newUser.name}
              onChange={(e) =>
                setNewUser((u) => ({ ...u, name: e.target.value }))
              }
            />
          </Field>

          <Field label="Role">
            <Input
              value={newUser.role}
              onChange={(e) =>
                setNewUser((u) => ({ ...u, role: e.target.value }))
              }
            />
          </Field>

          <Field label="Group">
            <Select
              value={newUser.groupId}
              onChange={(e) =>
                setNewUser((u) => ({ ...u, groupId: e.target.value }))
              }
            >
              {project.groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Email">
            <Input
              value={newUser.email}
              onChange={(e) =>
                setNewUser((u) => ({ ...u, email: e.target.value }))
              }
            />
          </Field>

          <div className="flex items-end">
            <Button className="w-full" onClick={addUser}>
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Group</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Active</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {project.users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100">
                  <td className="py-2 pr-3">
                    <Input
                      value={user.name}
                      onChange={(e) =>
                        upsertUser({ ...user, name: e.target.value })
                      }
                    />
                  </td>

                  <td className="py-2 pr-3">
                    <Input
                      value={user.role}
                      onChange={(e) =>
                        upsertUser({ ...user, role: e.target.value })
                      }
                    />
                  </td>

                  <td className="py-2 pr-3">
                    <Select
                      value={user.groupId}
                      onChange={(e) =>
                        upsertUser({ ...user, groupId: e.target.value })
                      }
                    >
                      <option value="">No Group</option>
                      {project.groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </Select>
                  </td>

                  <td className="py-2 pr-3">
                    <Input
                      value={user.email}
                      onChange={(e) =>
                        upsertUser({ ...user, email: e.target.value })
                      }
                    />
                  </td>

                  <td className="py-2 pr-3">
                    <input
                      type="checkbox"
                      checked={user.active}
                      onChange={(e) =>
                        upsertUser({ ...user, active: e.target.checked })
                      }
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>

                  <td className="py-2 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (window.confirm(`Delete user ${user.name}?`)) {
                          deleteUser(user.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}