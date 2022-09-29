import { createElement } from "react";
import { FileUploadComponent } from "./components/FileUploadComponent";

export function preview({ sampleText }) {
    return <FileUploadComponent sampleText={sampleText} />;
}

export function getPreviewCss() {
    return require("./ui/CustomFileWidget.css");
}
