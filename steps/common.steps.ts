import { Given} from "@cucumber/cucumber";
import { BasePage } from "../pages/base.page.js";

Given(' I will go to url {string}', async function(url:string){
    const basePage:BasePage = new BasePage(this.page);
    await basePage.goto(url); 
});