import { Component, createElement } from "react";

import { FileUploadComponent } from "./components/FileUploadComponent";
import "./ui/CustomFileWidget.css";

export default class CustomFileWidget extends Component {
    
    render() {

        return <FileUploadComponent 
            contextFileObject={this.props.contextFileObject}
            identifierAttribute={this.props.identifierAttribute}
            fileTypeAttribute={this.props.fileTypeAttribute}
            contentAttribute={this.props.contentAttribute} 
            uploadMicroflow={this.props.uploadMicroflow}
        />;
    }
}
