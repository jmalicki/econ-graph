#!/usr/bin/env python3
"""
GitHub Actions Workflow Validation Script
Validates GitHub Actions workflow files for common issues
"""

import yaml
import sys
import os

def validate_workflow(file_path):
    """Validate a single GitHub Actions workflow file"""
    try:
        with open(file_path, "r") as f:
            workflow = yaml.safe_load(f)

        errors = []

        # Check for required fields
        if "name" not in workflow:
            errors.append("Missing required field: name")

        # Handle YAML quirk where 'on' is parsed as boolean True
        on_field = workflow.get("on") or workflow.get(True)
        if not on_field:
            errors.append("Missing required field: on (triggers)")
        elif not on_field:
            errors.append("Empty on field - no triggers defined")

        if "jobs" not in workflow:
            errors.append("Missing required field: jobs")
        elif not workflow["jobs"]:
            errors.append("Empty jobs field - no jobs defined")

        # Check for common issues
        if on_field:
            if isinstance(on_field, dict):
                # Check for empty trigger objects
                for trigger, config in on_field.items():
                    if isinstance(config, dict) and not config:
                        errors.append(f"Empty {trigger} trigger configuration")
                    elif isinstance(config, list) and not config:
                        errors.append(f"Empty {trigger} trigger list")

        # Check jobs structure
        if "jobs" in workflow:
            for job_name, job_config in workflow["jobs"].items():
                if not isinstance(job_config, dict):
                    errors.append(f"Job {job_name} is not a dictionary")
                    continue

                if "runs-on" not in job_config:
                    errors.append(f"Job {job_name} missing runs-on field")

                if "steps" not in job_config:
                    errors.append(f"Job {job_name} missing steps field")
                elif not job_config["steps"]:
                    errors.append(f"Job {job_name} has empty steps")

        if errors:
            print(f"❌ {file_path}:")
            for error in errors:
                print(f"  - {error}")
            return False
        else:
            print(f"✅ {file_path} - Valid")
            return True

    except yaml.YAMLError as e:
        print(f"❌ {file_path} - YAML Error: {e}")
        return False
    except Exception as e:
        print(f"❌ {file_path} - Error: {e}")
        return False

def main():
    """Main function to validate all provided workflow files"""
    if len(sys.argv) < 2:
        print("Usage: validate-github-actions.py <workflow-file1> [workflow-file2] ...")
        sys.exit(1)

    all_valid = True
    for file_path in sys.argv[1:]:
        if not validate_workflow(file_path):
            all_valid = False

    if not all_valid:
        sys.exit(1)

if __name__ == "__main__":
    main()
