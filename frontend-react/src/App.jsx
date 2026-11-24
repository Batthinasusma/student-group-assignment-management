

import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, BookOpen, ClipboardList,
  Plus, GraduationCap, UsersRound, CheckCircle,
  LogOut, X, ExternalLink
} from "lucide-react";

const API = "https://student-management-backend-gogo.onrender.com/api";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teams, setTeams] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [memberEmails, setMemberEmails] = useState({});
  const [submissionLinks, setSubmissionLinks] = useState({});
  const [newTeamName, setNewTeamName] = useState("");
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    title: "", description: "", onedrive_link: "",
    due_date: "", group_id: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  function notify(text, type = "success") {
    setMessage(text);
    setMessageType(type);
  }

  async function apiRequest(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  }

  useEffect(() => {
    if (token) {
      loadDashboard();
    }
  }, [token]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [teamData, assignmentData] = await Promise.all([
        apiRequest("/groups"),
        apiRequest("/assignments")
      ]);
      setTeams(teamData);
      setAssignments(assignmentData);

      if (user?.role === "professor") {
        const results = await Promise.all(
          assignmentData.map(async (assignment) => {
            try {
              const rows = await apiRequest(
                `/assignments/${assignment.id}/submissions`
              );
              return [assignment.id, rows];
            } catch {
              return [assignment.id, []];
            }
          })
        );
        setSubmissions(Object.fromEntries(results));
      }
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      setToken(data.token);
      notify("Login successful!");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function createTeam(e) {
    e.preventDefault();
    try {
      await apiRequest("/groups", {
        method: "POST",
        body: JSON.stringify({ group_name: newTeamName })
      });
      setNewTeamName("");
      setShowTeamForm(false);
      notify("Team created successfully!");
      await loadDashboard();
    } catch (error) {
      notify(error.message, "error");
    }
  }

  async function addStudent(groupId) {
    try {
      await apiRequest(`/groups/${groupId}/members`, {
        method: "POST",
        body: JSON.stringify({ email: memberEmails[groupId] || "" })
      });
      setMemberEmails(previous => ({ ...previous, [groupId]: "" }));
      notify("Student added successfully!");
    } catch (error) {
      notify(error.message, "error");
    }
  }

  async function createAssignment(e) {
    e.preventDefault();
    try {
      await apiRequest("/assignments", {
        method: "POST",
        body: JSON.stringify({
          ...assignmentForm,
          group_id: Number(assignmentForm.group_id),
          due_date: assignmentForm.due_date
            ? new Date(assignmentForm.due_date).toISOString()
            : null
        })
      });

      setAssignmentForm({
        title: "", description: "", onedrive_link: "",
        due_date: "", group_id: ""
      });
      setShowAssignmentForm(false);
      notify("Assignment created successfully!");
      await loadDashboard();
    } catch (error) {
      notify(error.message, "error");
    }
  }

  async function submitAssignment(assignmentId) {
    try {
      await apiRequest(`/assignments/${assignmentId}/submit`, {
        method: "POST",
        body: JSON.stringify({
          submission_link: submissionLinks[assignmentId] || ""
        })
      });
      setSubmissionLinks(previous => ({
        ...previous,
        [assignmentId]: ""
      }));
      notify("Assignment submitted successfully!");
      await loadDashboard();
    } catch (error) {
      notify(error.message, "error");
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setTeams([]);
    setAssignments([]);
    setSubmissions({});
    setMessage("");
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-5">
        <form onSubmit={handleLogin}
          className="bg-white w-full max-w-md p-8 rounded-2xl shadow-lg">
          <div className="flex justify-center mb-5">
            <GraduationCap size={48} className="text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-center text-slate-800">
            StudentHub
          </h1>
          <p className="text-center text-slate-500 mt-2 mb-7">
            Login to your account
          </p>
          <label className="block mb-2 font-medium">Email</label>
          <input type="email" required value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border rounded-lg p-3 mb-5"
            placeholder="Enter your email" />
          <label className="block mb-2 font-medium">Password</label>
          <input type="password" required value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border rounded-lg p-3 mb-5"
            placeholder="Enter your password" />
          {message && <p className="text-red-600 mb-4">{message}</p>}
          <button disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="w-64 bg-slate-900 text-white p-6 hidden md:block">
        <div className="flex items-center gap-3 mb-10">
          <GraduationCap size={32} className="text-blue-400" />
          <h1 className="text-xl font-bold">StudentHub</h1>
        </div>
        <p className="text-xs text-slate-400 mb-4">MAIN MENU</p>
        <nav className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-blue-600 rounded-lg">
            <LayoutDashboard size={20} /> Dashboard
          </div>
          <div className="flex items-center gap-3 p-3 text-slate-300">
            <Users size={20} /> My Teams
          </div>
          <div className="flex items-center gap-3 p-3 text-slate-300">
            <BookOpen size={20} /> Assignments
          </div>
          <div className="flex items-center gap-3 p-3 text-slate-300">
            <ClipboardList size={20} /> Submissions
          </div>
        </nav>
      </aside>

      <main className="flex-1 p-5 md:p-10 min-w-0">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
            <p className="text-slate-500 mt-1">
              Welcome, {user?.name || "User"} ({user?.role || "account"})
            </p>
          </div>
          <button onClick={logout}
            className="flex items-center gap-2 text-red-600">
            <LogOut size={20} /> Logout
          </button>
        </header>

        {message && (
          <div className={`mb-5 p-3 rounded-lg ${
            messageType === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}>
            {message}
            <button className="float-right" onClick={() => setMessage("")}>
              <X size={18} />
            </button>
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <SummaryCard title="My Teams" value={teams.length}
            icon={<UsersRound />} color="bg-purple-100 text-purple-600" />
          <SummaryCard title="Assignments" value={assignments.length}
            icon={<BookOpen />} color="bg-orange-100 text-orange-600" />
          <SummaryCard title="Submissions"
            value={Object.values(submissions).reduce((sum, rows) => sum + rows.length, 0)}
            icon={<CheckCircle />} color="bg-green-100 text-green-600" />
        </section>

        {user?.role === "student" && (
          <section className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-xl font-bold">My Teams</h3>
                <p className="text-sm text-slate-500">Your student groups</p>
              </div>
              <button onClick={() => setShowTeamForm(!showTeamForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex gap-2 items-center">
                {showTeamForm ? <X size={18} /> : <Plus size={18} />}
                {showTeamForm ? "Cancel" : "Create Team"}
              </button>
            </div>

            {showTeamForm && (
              <form onSubmit={createTeam} className="flex gap-3 mb-5">
                <input required value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  placeholder="Team name"
                  className="border rounded-lg p-3 flex-1 min-w-0" />
                <button className="bg-green-600 text-white px-4 rounded-lg">
                  Save
                </button>
              </form>
            )}

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {teams.map(team => (
                <div key={team.id} className="border rounded-xl p-5">
                  <UsersRound className="text-blue-600 mb-3" />
                  <h4 className="font-bold">{team.group_name}</h4>
                  <p className="text-sm text-slate-500 mb-4">
                    Group ID: {team.id}
                  </p>
                  <input type="email"
                    placeholder="Student email"
                    value={memberEmails[team.id] || ""}
                    onChange={e => setMemberEmails(prev => ({
                      ...prev, [team.id]: e.target.value
                    }))}
                    className="border rounded-lg p-2 w-full mb-2" />
                  <button onClick={() => addStudent(team.id)}
                    className="bg-blue-600 text-white rounded-lg p-2 w-full">
                    Add Student
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {user?.role === "professor" && (
          <section className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-xl font-bold">Manage Assignments</h3>
                <p className="text-sm text-slate-500">
                  Create and allocate assignments to groups
                </p>
              </div>
              <button onClick={() => setShowAssignmentForm(!showAssignmentForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex gap-2">
                {showAssignmentForm ? <X size={18} /> : <Plus size={18} />}
                {showAssignmentForm ? "Cancel" : "Create Assignment"}
              </button>
            </div>

            {showAssignmentForm && (
              <form onSubmit={createAssignment} className="grid md:grid-cols-2 gap-4 mb-6">
                <input required placeholder="Assignment title"
                  value={assignmentForm.title}
                  onChange={e => setAssignmentForm(p => ({ ...p, title: e.target.value }))}
                  className="border rounded-lg p-3" />
                <select required value={assignmentForm.group_id}
                  onChange={e => setAssignmentForm(p => ({ ...p, group_id: e.target.value }))}
                  className="border rounded-lg p-3">
                  <option value="">Select group</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.group_name}</option>
                  ))}
                </select>
                <textarea placeholder="Description"
                  value={assignmentForm.description}
                  onChange={e => setAssignmentForm(p => ({ ...p, description: e.target.value }))}
                  className="border rounded-lg p-3 md:col-span-2" />
                <input type="url" placeholder="Assignment file link"
                  value={assignmentForm.onedrive_link}
                  onChange={e => setAssignmentForm(p => ({ ...p, onedrive_link: e.target.value }))}
                  className="border rounded-lg p-3" />
                <label className="text-sm text-slate-600">
                  Due date and time
                  <input type="datetime-local" value={assignmentForm.due_date}
                    onChange={e => setAssignmentForm(p => ({ ...p, due_date: e.target.value }))}
                    className="border rounded-lg p-3 w-full mt-1" />
                </label>
                <button className="bg-green-600 text-white p-3 rounded-lg md:col-span-2">
                  Publish Assignment
                </button>
              </form>
            )}
          </section>
        )}

        <section className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <h3 className="text-xl font-bold mb-5">
            {user?.role === "professor" ? "My Assignments" : "Available Assignments"}
          </h3>

          {assignments.length === 0 && (
            <p className="text-slate-500">No assignments available yet.</p>
          )}

          <div className="space-y-4">
            {assignments.map(assignment => (
              <div key={assignment.id} className="border rounded-xl p-5">
                <div className="flex justify-between gap-3 flex-wrap">
                  <h4 className="font-bold text-lg">{assignment.title}</h4>
                  <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full h-fit">
                    Assignment #{assignment.id}
                  </span>
                </div>
                <p className="text-slate-600 mt-2">{assignment.description}</p>
                <p className="text-sm text-slate-500 mt-2">
                  Due: {assignment.due_date
                    ? new Date(assignment.due_date).toLocaleString()
                    : "Not specified"}
                </p>

                {assignment.onedrive_link && (
                  <a href={assignment.onedrive_link} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 mt-3">
                    Open assignment <ExternalLink size={16} />
                  </a>
                )}

                {user?.role === "student" && (
                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <input type="url"
                      placeholder="Paste your submission link"
                      value={submissionLinks[assignment.id] || ""}
                      onChange={e => setSubmissionLinks(p => ({
                        ...p, [assignment.id]: e.target.value
                      }))}
                      className="border rounded-lg p-3 flex-1 min-w-0" />
                    <button onClick={() => submitAssignment(assignment.id)}
                      className="bg-green-600 text-white px-5 py-3 rounded-lg">
                      Submit Work
                    </button>
                  </div>
                )}

                {user?.role === "professor" && (
                  <div className="mt-5 border-t pt-4">
                    <h5 className="font-semibold mb-3">
                      Student Submissions ({(submissions[assignment.id] || []).length})
                    </h5>
                    {(submissions[assignment.id] || []).map(sub => (
                      <div key={sub.id} className="bg-slate-50 rounded-lg p-3 mb-2">
                        <p className="font-medium">{sub.name} ({sub.email})</p>
                        <p className="text-sm text-slate-500">
                          Status: {sub.status} · {sub.submitted_at
                            ? new Date(sub.submitted_at).toLocaleString()
                            : ""}
                        </p>
                        <a href={sub.submission_link} target="_blank" rel="noreferrer"
                          className="text-blue-600 inline-flex items-center gap-1 mt-1">
                          View submission <ExternalLink size={14} />
                        </a>
                      </div>
                    ))}
                    {(submissions[assignment.id] || []).length === 0 && (
                      <p className="text-sm text-slate-500">No submissions yet.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <footer className="text-center text-sm text-slate-400 mt-10">
          Student Management System © 2026
        </footer>
      </main>
    </div>
  );
}

function SummaryCard({ title, value, icon, color }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <h3 className="text-3xl font-bold mt-2">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

export default App;
