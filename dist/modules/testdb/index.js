"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prismaClient_1 = __importDefault(require("../../prisma-client/prismaClient"));
console.log("test");
async function main() {
    const user = await prismaClient_1.default.category.create({
        data: {
            name: "abul dir",
            imageUrl: "https://images.pexels.com/photos/104827/cat-pet-animal-domestic-104827.jpeg?auto=compress&cs=tinysrgb&w=600",
        },
    });
    console.log(user);
}
main()
    .then(async () => {
    await prismaClient_1.default.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prismaClient_1.default.$disconnect();
    process.exit(1);
});
//npx ts-node src/modules/testdb/index.ts
// https://medium.com/@VincentSchoener/say-bye-to-relative-paths-in-typescript-7242b6e6f252
