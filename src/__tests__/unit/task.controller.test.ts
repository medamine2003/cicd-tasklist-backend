import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import type { Task } from "@prisma/client";

vi.mock("../../services/task.service.js", () => ({
	findAll: vi.fn(),
	findById: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	remove: vi.fn(),
}));

import * as taskService from "../../services/task.service.js";
import * as taskController from "../../controllers/task.controller.js";

const mockService = vi.mocked(taskService);

const mockTask: Task = {
	id: 1,
	title: "Test Task",
	description: "Test description",
	completed: false,
	createdAt: new Date("2026-01-01"),
	updatedAt: new Date("2026-01-01"),
};

function createMockResponse(): Response {
	return {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
		send: vi.fn().mockReturnThis(),
	} as unknown as Response;
}

function createMockRequest(overrides: Partial<Request> = {}): Request {
	return {
		params: {},
		body: {},
		query: {},
		...overrides,
	} as unknown as Request;
}

describe("TaskController", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getAllTasks", () => {
		it("should return 200 with all tasks", async () => {
			mockService.findAll.mockResolvedValue([mockTask]);

			const req = createMockRequest();
			const res = createMockResponse();

			await taskController.getAllTasks(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith([mockTask]);
		});

		it("should return 500 on error", async () => {
			mockService.findAll.mockRejectedValue(new Error("DB error"));

			const req = createMockRequest();
			const res = createMockResponse();

			await taskController.getAllTasks(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				error: "Failed to fetch tasks",
			});
		});
	});

	describe("getTaskById", () => {
		it("should return 200 with task", async () => {
			mockService.findById.mockResolvedValue(mockTask);

			const req = createMockRequest({
				params: { id: "1" },
			});
			const res = createMockResponse();

			await taskController.getTaskById(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(mockTask);
		});

		it("should return 400 for invalid id", async () => {
			const req = createMockRequest({
				params: { id: "abc" },
			});
			const res = createMockResponse();

			await taskController.getTaskById(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
		});

		it("should return 404 if task not found", async () => {
			mockService.findById.mockResolvedValue(null);

			const req = createMockRequest({
				params: { id: "1" },
			});
			const res = createMockResponse();

			await taskController.getTaskById(req, res);

			expect(res.status).toHaveBeenCalledWith(404);
		});
	});

	describe("createTask", () => {
		it("should create a task", async () => {
			mockService.create.mockResolvedValue(mockTask);

			const req = createMockRequest({
				body: {
					title: "Test Task",
					description: "Test description",
				},
			});

			const res = createMockResponse();

			await taskController.createTask(req, res);

			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith(mockTask);
		});

		it("should return 400 if title missing", async () => {
			const req = createMockRequest({
				body: {},
			});

			const res = createMockResponse();

			await taskController.createTask(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
		});
	});

	describe("updateTask", () => {
		it("should update task", async () => {
			mockService.update.mockResolvedValue({
				...mockTask,
				completed: true,
			});

			const req = createMockRequest({
				params: { id: "1" },
				body: { completed: true },
			});

			const res = createMockResponse();

			await taskController.updateTask(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
		});

		it("should return 404 if task not found", async () => {
			mockService.update.mockRejectedValue(
				new Error("Task not found"),
			);

			const req = createMockRequest({
				params: { id: "1" },
				body: {},
			});

			const res = createMockResponse();

			await taskController.updateTask(req, res);

			expect(res.status).toHaveBeenCalledWith(404);
		});
	});

	describe("deleteTask", () => {
		it("should delete task", async () => {
			mockService.remove.mockResolvedValue(mockTask);

			const req = createMockRequest({
				params: { id: "1" },
			});

			const res = createMockResponse();

			await taskController.deleteTask(req, res);

			expect(res.status).toHaveBeenCalledWith(204);
		});

		it("should return 404 if task not found", async () => {
			mockService.remove.mockRejectedValue(
				new Error("Task not found"),
			);

			const req = createMockRequest({
				params: { id: "1" },
			});

			const res = createMockResponse();

			await taskController.deleteTask(req, res);

			expect(res.status).toHaveBeenCalledWith(404);
		});
	});
});