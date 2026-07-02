import {
	describe,
	it,
	expect,
	beforeEach,
	afterAll,
	vi,
} from "vitest";

import testPrisma from "./setup.js";

vi.mock("../../lib/prisma.js", () => ({
	default: testPrisma,
}));

const { default: app } = await import("../../app.js");

import request from "supertest";

describe("Task API E2E Tests", () => {
	beforeEach(async () => {
		await testPrisma.task.deleteMany();
	});

	afterAll(async () => {
		await testPrisma.$disconnect();
	});

	describe("POST /api/tasks", () => {
		it("should create a new task", async () => {
			const res = await request(app)
				.post("/api/tasks")
				.send({
					title: "E2E Task",
					description: "E2E Description",
				});

			expect(res.status).toBe(201);

			expect(res.body).toHaveProperty("id");
			expect(res.body.title).toBe("E2E Task");
			expect(res.body.description).toBe("E2E Description");
			expect(res.body.completed).toBe(false);
		});

		it("should return 400 if title is missing", async () => {
			const res = await request(app)
				.post("/api/tasks")
				.send({
					description: "No title",
				});

			expect(res.status).toBe(400);

			expect(res.body.error).toBeDefined();
		});

		it("should return 400 if title is empty", async () => {
			const res = await request(app)
				.post("/api/tasks")
				.send({
					title: "",
				});

			expect(res.status).toBe(400);
		});
	});

	describe("GET /api/tasks", () => {
		it("should return all tasks", async () => {
			await testPrisma.task.create({
				data: {
					title: "Task 1",
				},
			});

			await testPrisma.task.create({
				data: {
					title: "Task 2",
				},
			});

			const res = await request(app).get("/api/tasks");

			expect(res.status).toBe(200);

			expect(Array.isArray(res.body)).toBe(true);
			expect(res.body.length).toBe(2);
		});
	});

	describe("GET /api/tasks/:id", () => {
		it("should return a task by id", async () => {
			const task = await testPrisma.task.create({
				data: {
					title: "Find me",
				},
			});

			const res = await request(app).get(
				`/api/tasks/${task.id}`,
			);

			expect(res.status).toBe(200);

			expect(res.body.id).toBe(task.id);
			expect(res.body.title).toBe("Find me");
		});

		it("should return 404 if task does not exist", async () => {
			const res = await request(app).get("/api/tasks/9999");

			expect(res.status).toBe(404);
		});

		it("should return 400 for invalid id", async () => {
			const res = await request(app).get("/api/tasks/abc");

			expect(res.status).toBe(400);
		});
	});

	describe("PUT /api/tasks/:id", () => {
		it("should update a task", async () => {
			const task = await testPrisma.task.create({
				data: {
					title: "Old title",
				},
			});

			const res = await request(app)
				.put(`/api/tasks/${task.id}`)
				.send({
					title: "Updated title",
					completed: true,
				});

			expect(res.status).toBe(200);

			expect(res.body.title).toBe("Updated title");
			expect(res.body.completed).toBe(true);
		});

		it("should return 404 if task does not exist", async () => {
			const res = await request(app)
				.put("/api/tasks/9999")
				.send({
					title: "Updated",
				});

			expect(res.status).toBe(404);
		});

		it("should return 400 for invalid id", async () => {
			const res = await request(app)
				.put("/api/tasks/abc")
				.send({
					title: "Updated",
				});

			expect(res.status).toBe(400);
		});
	});

	describe("DELETE /api/tasks/:id", () => {
		it("should delete a task", async () => {
			const task = await testPrisma.task.create({
				data: {
					title: "Delete me",
				},
			});

			const res = await request(app).delete(
				`/api/tasks/${task.id}`,
			);

			expect(res.status).toBe(204);

			const deletedTask = await testPrisma.task.findUnique({
				where: {
					id: task.id,
				},
			});

			expect(deletedTask).toBeNull();
		});

		it("should return 404 if task does not exist", async () => {
			const res = await request(app).delete(
				"/api/tasks/9999",
			);

			expect(res.status).toBe(404);
		});

		it("should return 400 for invalid id", async () => {
			const res = await request(app).delete(
				"/api/tasks/abc",
			);

			expect(res.status).toBe(400);
		});
	});
});