// Generated from bench-api internal/headless/operations.json. Do not edit.
export const operationCatalog = {
  "operations": [
    {
      "auth": "account",
      "description": "Get setup status. Does not start an evaluation. Requires Bench OAuth account authorization; a scoped API key is insufficient.",
      "id": "get_setup_status",
      "mcp": true,
      "mcp_legacy": false,
      "method": "GET",
      "path": "/api/getting-started",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {
          "environment": {
            "type": "string"
          },
          "repo_full_name": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "public",
      "description": "List operations. Does not start an evaluation.",
      "id": "list_operations",
      "mcp": true,
      "mcp_legacy": false,
      "method": "GET",
      "path": "/api/headless/operations",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "description": "Read credential authority, plan, model-selection entitlement, repository scope and pricing and upgrade links, and links to the current operation catalog and evaluation allowance. Does not grant permissions. Does not start an evaluation.",
      "id": "capabilities",
      "mcp": true,
      "mcp_legacy": false,
      "method": "GET",
      "path": "/api/headless/capabilities",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "description": "Evaluation allowance. Does not start an evaluation.",
      "id": "evaluation_allowance",
      "mcp": true,
      "mcp_legacy": true,
      "method": "GET",
      "path": "/api/evaluation-allowance",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "public",
      "description": "Get processing notice. Does not start an evaluation.",
      "id": "get_processing_notice",
      "mcp": true,
      "mcp_legacy": false,
      "method": "GET",
      "path": "/api/legal/processing-notice",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "account",
      "body": {
        "additionalProperties": false,
        "properties": {
          "accepted": {
            "type": "boolean"
          },
          "source": {
            "type": "string"
          },
          "version": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Record the user's explicit authorization for the current processing notice and selected source. Read get_processing_notice and show the notice first; never accept it on the user's behalf without permission. Requires Bench OAuth account authorization; a scoped API key is insufficient.",
      "id": "acknowledge_processing",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/legal/processing-acknowledgements",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "public",
      "description": "Get login url. Does not start an evaluation.",
      "id": "get_login_url",
      "mcp": false,
      "mcp_legacy": false,
      "method": "GET",
      "path": "/api/auth/login-url",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {
          "challenge": {
            "type": "string"
          },
          "provider": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "public",
      "body": {
        "additionalProperties": false,
        "properties": {
          "code": {
            "type": "string"
          },
          "newsletter_consent": {
            "type": "boolean"
          },
          "state": {
            "type": "string"
          },
          "verifier": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Complete login. Uses the same validation and plan limits as Bench.",
      "id": "complete_login",
      "mcp": false,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/auth/callback",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "public",
      "body": {
        "additionalProperties": false,
        "properties": {
          "code": {
            "type": "string"
          },
          "newsletter_consent": {
            "type": "boolean"
          },
          "pending_authentication_token": {
            "type": "string"
          },
          "provider": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Verify email. Uses the same validation and plan limits as Bench.",
      "id": "verify_email",
      "mcp": false,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/auth/verify-email",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "public",
      "body": {
        "additionalProperties": false,
        "properties": {
          "email": {
            "type": "string"
          },
          "newsletter_consent": {
            "type": "boolean"
          },
          "password": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Login with password. Uses the same validation and plan limits as Bench.",
      "id": "login_with_password",
      "mcp": false,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/auth/password",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "public",
      "description": "Logout. Uses the same validation and plan limits as Bench.",
      "id": "logout",
      "mcp": false,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/auth/logout",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "public",
      "body": {
        "additionalProperties": false,
        "properties": {
          "token": {
            "type": "string"
          }
        },
        "required": [
          "token"
        ],
        "type": "object"
      },
      "description": "Exchange oauth token. Uses the same validation and plan limits as Bench.",
      "id": "exchange_oauth_token",
      "mcp": false,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/auth/mcp-token",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "Whoami. Does not start an evaluation.",
      "id": "whoami",
      "mcp": true,
      "mcp_legacy": true,
      "method": "GET",
      "path": "/api/auth/me",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "account",
      "body": {
        "additionalProperties": false,
        "properties": {
          "generation": {
            "type": "integer"
          }
        },
        "type": "object"
      },
      "description": "Record setup completion for the current account. Use onboarding_generation from whoami; a stale generation is rejected. No browser wizard is required. Requires Bench OAuth account authorization; a scoped API key is insufficient.",
      "id": "complete_onboarding",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/auth/onboarding/complete",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "name": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Update profile. Uses the same validation and plan limits as Bench.",
      "id": "update_profile",
      "mcp": true,
      "mcp_legacy": false,
      "method": "PATCH",
      "path": "/api/auth/me",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "providers": {
            "items": {
              "type": "string"
            },
            "type": "array"
          }
        },
        "type": "object"
      },
      "description": "Choose allowed model providers for future Bench evaluations. Requires an active Growth or Enterprise plan. Free and Builder use Bench defaults and cannot change this preference.",
      "id": "set_model_providers",
      "mcp": true,
      "mcp_legacy": false,
      "method": "PATCH",
      "path": "/api/auth/me/model-providers",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "public",
      "body": {
        "additionalProperties": false,
        "properties": {
          "installation_id": {
            "type": "integer"
          },
          "state": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Receive github callback. Uses the same validation and plan limits as Bench.",
      "id": "receive_github_callback",
      "mcp": false,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/github/headless-callback",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "account",
      "description": "Start GitHub repository authorization. Set headless=true to return to the coding agent after the user approves access on GitHub. Keep the returned state and poll finish_github_connection. GitHub installation approval is required; no Bench onboarding is needed.",
      "id": "connect_github",
      "mcp": true,
      "mcp_legacy": true,
      "method": "GET",
      "path": "/api/github/install-url",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {
          "headless": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "account",
      "body": {
        "additionalProperties": false,
        "properties": {
          "installation_id": {
            "type": "integer"
          },
          "state": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Complete a manual GitHub callback using the original account-bound state and installation_id. Prefer connect_github with headless=true and finish_github_connection. Requires Bench OAuth account authorization; a scoped API key is insufficient.",
      "id": "complete_github_callback",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/github/callback",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "account",
      "body": {
        "additionalProperties": false,
        "properties": {
          "state": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Finish the connection started with connect_github(headless=true). Pass its state. A pending response means wait the returned poll_interval before calling again. On success, list_repos and choose a branch. This binds the installation to the signed-in user. Requires Bench OAuth account authorization; a scoped API key is insufficient.",
      "id": "finish_github_connection",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/github/connection",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "Connection status. Does not start an evaluation.",
      "id": "connection_status",
      "mcp": true,
      "mcp_legacy": true,
      "method": "GET",
      "path": "/api/github/status",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "account",
      "description": "Activate installation. Uses the same validation and plan limits as Bench. Requires Bench OAuth account authorization; a scoped API key is insufficient.",
      "id": "activate_installation",
      "mcp": true,
      "mcp_legacy": true,
      "method": "POST",
      "path": "/api/github/installations/{installationID}/activate",
      "path_parameters": {
        "installationID": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "List repos. Does not start an evaluation.",
      "id": "list_repos",
      "mcp": true,
      "mcp_legacy": true,
      "method": "GET",
      "path": "/api/github/repos",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {
          "all_accounts": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "description": "List branches. Does not start an evaluation.",
      "id": "list_branches",
      "mcp": true,
      "mcp_legacy": true,
      "method": "GET",
      "path": "/api/github/repos/{owner}/{repo}/branches",
      "path_parameters": {
        "owner": {
          "minLength": 1,
          "type": "string"
        },
        "repo": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "description": "Upload prompts. Uses the same validation and plan limits as Bench.",
      "file_field": "files",
      "form": {
        "additionalProperties": false,
        "properties": {
          "model": {
            "type": "string"
          },
          "pasted_text": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "id": "upload_prompts",
      "max_file_bytes": 2097152,
      "mcp": true,
      "mcp_legacy": true,
      "method": "POST",
      "multipart": true,
      "path": "/api/prompt-scans",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "Scan repo. Uses the same validation and plan limits as Bench.",
      "id": "scan_repo",
      "mcp": true,
      "mcp_legacy": true,
      "method": "POST",
      "path": "/api/repos/{owner}/{repo}/scan",
      "path_parameters": {
        "owner": {
          "minLength": 1,
          "type": "string"
        },
        "repo": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {
          "branch": {
            "description": "Repository branch, required for branch-scoped operations.",
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "Get scan. Does not start an evaluation.",
      "id": "get_scan",
      "mcp": true,
      "mcp_legacy": true,
      "method": "GET",
      "path": "/api/repos/{owner}/{repo}/scan/latest",
      "path_parameters": {
        "owner": {
          "minLength": 1,
          "type": "string"
        },
        "repo": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {
          "branch": {
            "description": "Repository branch, required for branch-scoped operations.",
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "description": "Get repository refresh. Does not start an evaluation.",
      "id": "get_repository_refresh",
      "mcp": true,
      "mcp_legacy": false,
      "method": "GET",
      "path": "/api/repos/{owner}/{repo}/scan/refresh",
      "path_parameters": {
        "owner": {
          "minLength": 1,
          "type": "string"
        },
        "repo": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {
          "branch": {
            "description": "Repository branch, required for branch-scoped operations.",
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "enabled": {
            "type": "boolean"
          }
        },
        "type": "object"
      },
      "description": "Set repository refresh. Uses the same validation and plan limits as Bench.",
      "id": "set_repository_refresh",
      "mcp": true,
      "mcp_legacy": false,
      "method": "PATCH",
      "path": "/api/repos/{owner}/{repo}/scan/refresh",
      "path_parameters": {
        "owner": {
          "minLength": 1,
          "type": "string"
        },
        "repo": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {
          "branch": {
            "description": "Repository branch, required for branch-scoped operations.",
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "call_site_ids": {
            "items": {
              "type": "string"
            },
            "type": "array"
          },
          "model": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Record the model used by uploaded prompt call sites. This changes source metadata, not the allowed-provider setting. Requires model-selection entitlement.",
      "id": "set_prompt_models",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/repos/{owner}/{repo}/scan/call-sites/model",
      "path_parameters": {
        "owner": {
          "minLength": 1,
          "type": "string"
        },
        "repo": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {
          "branch": {
            "description": "Repository branch, required for branch-scoped operations.",
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "base_branch": {
            "type": "string"
          },
          "body": {
            "type": "string"
          },
          "branch": {
            "type": "string"
          },
          "changes": {
            "items": {
              "additionalProperties": false,
              "properties": {
                "content": {
                  "type": "string"
                },
                "path": {
                  "type": "string"
                }
              },
              "type": "object"
            },
            "type": "array"
          },
          "title": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Open prompt pr. Uses the same validation and plan limits as Bench.",
      "id": "open_prompt_pr",
      "mcp": true,
      "mcp_legacy": true,
      "method": "POST",
      "path": "/api/repos/{owner}/{repo}/prompt-pr",
      "path_parameters": {
        "owner": {
          "minLength": 1,
          "type": "string"
        },
        "repo": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {
          "branch": {
            "description": "Repository branch, required for branch-scoped operations.",
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "business_doc_text": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Generate business context. Uses the same validation and plan limits as Bench.",
      "id": "generate_business_context",
      "mcp": true,
      "mcp_legacy": true,
      "method": "POST",
      "path": "/api/repos/{owner}/{repo}/business-context",
      "path_parameters": {
        "owner": {
          "minLength": 1,
          "type": "string"
        },
        "repo": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {
          "branch": {
            "description": "Repository branch, required for branch-scoped operations.",
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "Get business context. Does not start an evaluation.",
      "id": "get_business_context",
      "mcp": true,
      "mcp_legacy": true,
      "method": "GET",
      "path": "/api/repos/{owner}/{repo}/business-context/latest",
      "path_parameters": {
        "owner": {
          "minLength": 1,
          "type": "string"
        },
        "repo": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {
          "branch": {
            "description": "Repository branch, required for branch-scoped operations.",
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "previous_routing_json": {
            "type": "string"
          },
          "reference_today": {
            "type": "string"
          },
          "suite_name": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Generate eval benchmark. Uses the same validation and plan limits as Bench.",
      "id": "generate_eval_benchmark",
      "mcp": true,
      "mcp_legacy": true,
      "method": "POST",
      "path": "/api/repos/{owner}/{repo}/eval-benchmark",
      "path_parameters": {
        "owner": {
          "minLength": 1,
          "type": "string"
        },
        "repo": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {
          "branch": {
            "description": "Repository branch, required for branch-scoped operations.",
            "type": "string"
          },
          "call_site_id": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": false,
      "streaming": true
    },
    {
      "auth": "credential",
      "description": "Get eval benchmark. Does not start an evaluation.",
      "id": "get_eval_benchmark",
      "mcp": true,
      "mcp_legacy": true,
      "method": "GET",
      "path": "/api/repos/{owner}/{repo}/eval-benchmark/latest",
      "path_parameters": {
        "owner": {
          "minLength": 1,
          "type": "string"
        },
        "repo": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {
          "branch": {
            "description": "Repository branch, required for branch-scoped operations.",
            "type": "string"
          },
          "call_site_id": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "branch": {
            "type": "string"
          },
          "call_site_id": {
            "type": "string"
          },
          "test_cases": {}
        },
        "type": "object"
      },
      "description": "Review eval benchmark. Uses the same validation and plan limits as Bench.",
      "id": "review_eval_benchmark",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/repos/{owner}/{repo}/eval-benchmark/review",
      "path_parameters": {
        "owner": {
          "minLength": 1,
          "type": "string"
        },
        "repo": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {
          "branch": {
            "description": "Repository branch, required for branch-scoped operations.",
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "max_concurrency": {
            "type": "integer"
          },
          "model": {
            "type": "string"
          },
          "suite_name": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Run baseline scoring for an existing reviewed benchmark. This can consume an evaluation credit; confirm spending first. Streamed events preserve progress and terminal errors. A model override requires Growth or Enterprise.",
      "id": "run_baseline",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/repos/{owner}/{repo}/baseline",
      "path_parameters": {
        "owner": {
          "minLength": 1,
          "type": "string"
        },
        "repo": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {
          "branch": {
            "description": "Repository branch, required for branch-scoped operations.",
            "type": "string"
          },
          "call_site_id": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": false,
      "streaming": true
    },
    {
      "auth": "credential",
      "description": "Get baseline. Does not start an evaluation.",
      "id": "get_baseline",
      "mcp": true,
      "mcp_legacy": true,
      "method": "GET",
      "path": "/api/repos/{owner}/{repo}/baseline/latest",
      "path_parameters": {
        "owner": {
          "minLength": 1,
          "type": "string"
        },
        "repo": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {
          "branch": {
            "description": "Repository branch, required for branch-scoped operations.",
            "type": "string"
          },
          "call_site_id": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "candidate_models": {
            "items": {
              "additionalProperties": false,
              "properties": {
                "model_id": {
                  "type": "string"
                },
                "provider": {
                  "type": "string"
                },
                "tier": {
                  "type": "string"
                }
              },
              "type": "object"
            },
            "type": "array"
          },
          "max_case_concurrency": {
            "type": "integer"
          },
          "max_combo_concurrency": {
            "type": "integer"
          },
          "max_rounds": {
            "type": "integer"
          },
          "min_quality_score": {
            "type": "number"
          },
          "suite_name": {
            "type": "string"
          },
          "variant_count": {
            "type": "integer"
          }
        },
        "type": "object"
      },
      "description": "Evaluate prompt improvements after a baseline. Confirm evaluation spending first. Candidate lists are server controlled on all plans; use set_model_providers for eligible provider preferences.",
      "id": "run_search_optimize",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/repos/{owner}/{repo}/search-optimize",
      "path_parameters": {
        "owner": {
          "minLength": 1,
          "type": "string"
        },
        "repo": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {
          "branch": {
            "description": "Repository branch, required for branch-scoped operations.",
            "type": "string"
          },
          "call_site_id": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": false,
      "streaming": true
    },
    {
      "auth": "credential",
      "description": "Get search optimize. Does not start an evaluation.",
      "id": "get_search_optimize",
      "mcp": true,
      "mcp_legacy": false,
      "method": "GET",
      "path": "/api/repos/{owner}/{repo}/search-optimize/latest",
      "path_parameters": {
        "owner": {
          "minLength": 1,
          "type": "string"
        },
        "repo": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {
          "branch": {
            "description": "Repository branch, required for branch-scoped operations.",
            "type": "string"
          },
          "call_site_id": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "description": "Get recommendation. Does not start an evaluation.",
      "id": "get_recommendation",
      "mcp": true,
      "mcp_legacy": true,
      "method": "GET",
      "path": "/api/repos/{owner}/{repo}/recommend/latest",
      "path_parameters": {
        "owner": {
          "minLength": 1,
          "type": "string"
        },
        "repo": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {
          "branch": {
            "description": "Repository branch, required for branch-scoped operations.",
            "type": "string"
          },
          "call_site_id": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "description": "List golden cases. Does not start an evaluation.",
      "id": "list_golden_cases",
      "mcp": true,
      "mcp_legacy": false,
      "method": "GET",
      "path": "/api/repos/{owner}/{repo}/golden-cases",
      "path_parameters": {
        "owner": {
          "minLength": 1,
          "type": "string"
        },
        "repo": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {
          "branch": {
            "description": "Repository branch, required for branch-scoped operations.",
            "type": "string"
          },
          "call_site_id": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "label": {
            "type": "string"
          },
          "note": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Label golden case. Uses the same validation and plan limits as Bench.",
      "id": "label_golden_case",
      "mcp": true,
      "mcp_legacy": false,
      "method": "PATCH",
      "path": "/api/golden-cases/{id}",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "url": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Fetch website text. Uses the same validation and plan limits as Bench.",
      "id": "fetch_website_text",
      "mcp": true,
      "mcp_legacy": true,
      "method": "POST",
      "path": "/api/website-text",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "url": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Get link metadata. Uses the same validation and plan limits as Bench.",
      "id": "get_link_metadata",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/link-metadata",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "ai_system_id": {
            "type": "integer"
          },
          "branch": {
            "type": "string"
          },
          "context_doc": {
            "type": "string"
          },
          "generate_context": {
            "type": "boolean"
          },
          "max_rounds": {
            "type": "integer"
          },
          "min_quality_score": {
            "type": "number"
          },
          "prompts": {
            "items": {
              "additionalProperties": false,
              "properties": {
                "call_site_id": {
                  "type": "string"
                },
                "workflow_name": {
                  "type": "string"
                }
              },
              "type": "object"
            },
            "type": "array"
          },
          "repo_full_name": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Start evaluation. Uses the same validation and plan limits as Bench.",
      "id": "start_evaluation",
      "mcp": true,
      "mcp_legacy": true,
      "method": "POST",
      "path": "/api/evaluation-runs",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "ai_system_id": {
            "type": "integer"
          }
        },
        "type": "object"
      },
      "description": "Start system evaluation. Uses the same validation and plan limits as Bench.",
      "id": "start_system_evaluation",
      "mcp": true,
      "mcp_legacy": true,
      "method": "POST",
      "path": "/api/evaluation-runs/system",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "List evaluations. Does not start an evaluation.",
      "id": "list_evaluations",
      "mcp": true,
      "mcp_legacy": true,
      "method": "GET",
      "path": "/api/evaluation-runs",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {
          "include_active": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "context_doc": {
            "type": "string"
          },
          "generate_context": {
            "type": "boolean"
          },
          "single_prompt": {
            "type": "boolean"
          }
        },
        "type": "object"
      },
      "description": "Rerun evaluation. Uses the same validation and plan limits as Bench.",
      "id": "rerun_evaluation",
      "mcp": true,
      "mcp_legacy": true,
      "method": "POST",
      "path": "/api/evaluation-runs/{id}/rerun",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "Get evaluation. Does not start an evaluation.",
      "id": "get_evaluation",
      "mcp": true,
      "mcp_legacy": true,
      "method": "GET",
      "path": "/api/evaluation-runs/{id}",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "description": "Get evaluation artifacts. Does not start an evaluation.",
      "id": "get_evaluation_artifacts",
      "mcp": true,
      "mcp_legacy": true,
      "method": "GET",
      "path": "/api/evaluation-runs/{id}/artifacts",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "description": "Get fix brief. Does not start an evaluation.",
      "id": "get_fix_brief",
      "mcp": true,
      "mcp_legacy": true,
      "method": "GET",
      "path": "/api/evaluation-runs/{id}/fix-brief",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "description": "Cancel evaluation. Uses the same validation and plan limits as Bench.",
      "id": "cancel_evaluation",
      "mcp": true,
      "mcp_legacy": true,
      "method": "POST",
      "path": "/api/evaluation-runs/{id}/cancel",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "Cancel bench. Uses the same validation and plan limits as Bench.",
      "id": "cancel_bench",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/evaluation-runs/{id}/cancel-bench",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "test_cases": {}
        },
        "type": "object"
      },
      "description": "Submit run review. Uses the same validation and plan limits as Bench.",
      "id": "submit_run_review",
      "mcp": true,
      "mcp_legacy": true,
      "method": "POST",
      "path": "/api/evaluation-runs/{id}/review",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "Archive evaluation. Uses the same validation and plan limits as Bench.",
      "id": "archive_evaluation",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/evaluation-runs/{id}/archive",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "Unarchive evaluation. Uses the same validation and plan limits as Bench.",
      "id": "unarchive_evaluation",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/evaluation-runs/{id}/unarchive",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "account",
      "body": {
        "additionalProperties": false,
        "properties": {
          "description": {
            "type": "string"
          },
          "name": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Create an AI system with a name and optional description. Add prompt, tool or harness components after scanning a repository or uploading prompts. Requires Bench OAuth account authorization; a scoped API key is insufficient.",
      "id": "create_system",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/ai-systems",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "List systems. Does not start an evaluation.",
      "id": "list_systems",
      "mcp": true,
      "mcp_legacy": true,
      "method": "GET",
      "path": "/api/ai-systems",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "description": "Get system. Does not start an evaluation.",
      "id": "get_system",
      "mcp": true,
      "mcp_legacy": true,
      "method": "GET",
      "path": "/api/ai-systems/{id}",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "description": "List runtime evaluations. Does not start an evaluation.",
      "id": "list_runtime_evaluations",
      "mcp": true,
      "mcp_legacy": false,
      "method": "GET",
      "path": "/api/ai-systems/{id}/runtime-evaluations",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {
          "environment": {
            "type": "string"
          },
          "offset": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": true,
        "properties": {},
        "type": "object"
      },
      "description": "Publish an SDK real app test report (maximum 500 KB). Execute the actual application with the SDK evaluateSystem/evaluate_system API first. Uploaded results remain client-reported evidence, not hosted verification.",
      "id": "publish_runtime_evaluation",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/ai-systems/{id}/runtime-evaluations",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "body": null,
      "description": "Read hosted runtime availability, settings and jobs. For local real app tests, use the SDK even when hosted execution is unavailable. Does not start an evaluation.",
      "id": "get_runtime_settings",
      "mcp": true,
      "mcp_legacy": false,
      "method": "GET",
      "path": "/api/ai-systems/{id}/runtime-settings",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "account",
      "body": {
        "additionalProperties": false,
        "properties": {
          "branch": {
            "type": "string"
          },
          "config": {
            "additionalProperties": true,
            "properties": {},
            "type": "object"
          },
          "daily_limit": {
            "type": "integer"
          },
          "enabled": {
            "type": "boolean"
          },
          "repository": {
            "type": "string"
          }
        },
        "required": [
          "repository",
          "branch",
          "enabled",
          "daily_limit",
          "config"
        ],
        "type": "object"
      },
      "description": "Configure hosted real app execution for a connected system: repository, branch, enabled, daily_limit and config. Check get_runtime_settings for environment availability. Enabling it can execute application code and consume evaluation allowance; obtain user approval first. Requires Bench OAuth account authorization; a scoped API key is insufficient.",
      "id": "set_runtime_settings",
      "mcp": true,
      "mcp_legacy": false,
      "method": "PUT",
      "path": "/api/ai-systems/{id}/runtime-settings",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "account",
      "description": "Publish runtime fix. Uses the same validation and plan limits as Bench. Requires Bench OAuth account authorization; a scoped API key is insufficient.",
      "id": "publish_runtime_fix",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/ai-systems/{id}/runtime-jobs/{jobID}/publish",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        },
        "jobID": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "account",
      "description": "Retry runtime job. Uses the same validation and plan limits as Bench. Requires Bench OAuth account authorization; a scoped API key is insufficient.",
      "id": "retry_runtime_job",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/ai-systems/{id}/runtime-jobs/{jobID}/retry",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        },
        "jobID": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "Preview CSV, XLSX, JSON or JSONL and suggested column mapping without storing it. Upload the file bytes, optional sheet, mode and mapping. Inspect mapping_error before import. No model runs.",
      "file_field": "file",
      "form": {
        "additionalProperties": false,
        "properties": {
          "content_consent": {
            "type": "boolean"
          },
          "mapping": {
            "additionalProperties": false,
            "properties": {
              "actual": {
                "type": "string"
              },
              "expected": {
                "type": "string"
              },
              "history": {
                "type": "string"
              },
              "input": {
                "type": "string"
              },
              "notes": {
                "type": "string"
              },
              "resolved_prompt": {
                "type": "string"
              },
              "template": {
                "type": "string"
              },
              "variables": {
                "type": "string"
              }
            },
            "type": "object"
          },
          "mode": {
            "enum": [
              "classifier",
              "recorded_outputs",
              "replay"
            ],
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "sheet": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "id": "preview_dataset",
      "max_file_bytes": 4194304,
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "multipart": true,
      "path": "/api/ai-systems/{id}/datasets/preview",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "List test library. Does not start an evaluation.",
      "id": "list_test_library",
      "mcp": true,
      "mcp_legacy": true,
      "method": "GET",
      "path": "/api/ai-systems/{id}/test-library",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {
          "kind": {
            "type": "string"
          },
          "offset": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "component_id": {
            "type": "integer"
          },
          "dataset_id": {
            "type": "string"
          },
          "dataset_version": {
            "type": "integer"
          },
          "expected_version": {
            "type": "integer"
          }
        },
        "type": "object"
      },
      "description": "Import dataset cases. Uses the same validation and plan limits as Bench.",
      "id": "import_dataset_cases",
      "mcp": true,
      "mcp_legacy": true,
      "method": "POST",
      "path": "/api/ai-systems/{id}/test-library/import",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "Store a dataset up to 4 MB after the user approves content_consent=true and the column mapping. Preview first. A stored dataset becomes a test suite only when import_dataset_cases is called.",
      "file_field": "file",
      "form": {
        "additionalProperties": false,
        "properties": {
          "content_consent": {
            "type": "boolean"
          },
          "mapping": {
            "additionalProperties": false,
            "properties": {
              "actual": {
                "type": "string"
              },
              "expected": {
                "type": "string"
              },
              "history": {
                "type": "string"
              },
              "input": {
                "type": "string"
              },
              "notes": {
                "type": "string"
              },
              "resolved_prompt": {
                "type": "string"
              },
              "template": {
                "type": "string"
              },
              "variables": {
                "type": "string"
              }
            },
            "type": "object"
          },
          "mode": {
            "enum": [
              "classifier",
              "recorded_outputs",
              "replay"
            ],
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "sheet": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "id": "upload_dataset",
      "max_file_bytes": 4194304,
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "multipart": true,
      "path": "/api/ai-systems/{id}/datasets",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "List datasets. Does not start an evaluation.",
      "id": "list_datasets",
      "mcp": true,
      "mcp_legacy": true,
      "method": "GET",
      "path": "/api/ai-systems/{id}/datasets",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "description": "Get dataset. Does not start an evaluation.",
      "id": "get_dataset",
      "mcp": true,
      "mcp_legacy": false,
      "method": "GET",
      "path": "/api/ai-systems/{id}/datasets/{datasetID}",
      "path_parameters": {
        "datasetID": {
          "minLength": 1,
          "type": "string"
        },
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {
          "version": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "expected_version": {
            "type": "integer"
          },
          "mapping": {
            "additionalProperties": false,
            "properties": {
              "actual": {
                "type": "string"
              },
              "expected": {
                "type": "string"
              },
              "history": {
                "type": "string"
              },
              "input": {
                "type": "string"
              },
              "notes": {
                "type": "string"
              },
              "resolved_prompt": {
                "type": "string"
              },
              "template": {
                "type": "string"
              },
              "variables": {
                "type": "string"
              }
            },
            "type": "object"
          },
          "mode": {
            "type": "string"
          }
        },
        "required": [
          "expected_version",
          "mapping",
          "mode"
        ],
        "type": "object"
      },
      "description": "Create a new dataset version with a corrected column mapping. Supply expected_version from get_dataset. Old reports retain their original mapping.",
      "id": "remap_dataset",
      "mcp": true,
      "mcp_legacy": false,
      "method": "PUT",
      "path": "/api/ai-systems/{id}/datasets/{datasetID}/mapping",
      "path_parameters": {
        "datasetID": {
          "minLength": 1,
          "type": "string"
        },
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "version": {
            "type": "integer"
          }
        },
        "type": "object"
      },
      "description": "Compare recorded outputs with expected values for an explicit dataset version. No model or live app is called. Live replay is not supported by this operation.",
      "id": "compare_dataset",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/ai-systems/{id}/datasets/{datasetID}/compare",
      "path_parameters": {
        "datasetID": {
          "minLength": 1,
          "type": "string"
        },
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "List dataset reports. Does not start an evaluation.",
      "id": "list_dataset_reports",
      "mcp": true,
      "mcp_legacy": false,
      "method": "GET",
      "path": "/api/ai-systems/{id}/datasets/{datasetID}/reports",
      "path_parameters": {
        "datasetID": {
          "minLength": 1,
          "type": "string"
        },
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "description": "Delete dataset. Uses the same validation and plan limits as Bench.",
      "id": "delete_dataset",
      "mcp": true,
      "mcp_legacy": false,
      "method": "DELETE",
      "path": "/api/ai-systems/{id}/datasets/{datasetID}",
      "path_parameters": {
        "datasetID": {
          "minLength": 1,
          "type": "string"
        },
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "Get system context. Does not start an evaluation.",
      "id": "get_system_context",
      "mcp": true,
      "mcp_legacy": true,
      "method": "GET",
      "path": "/api/ai-systems/{id}/context",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {
          "version": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "description": "List context sources. Does not start an evaluation.",
      "id": "list_context_sources",
      "mcp": true,
      "mcp_legacy": true,
      "method": "GET",
      "path": "/api/ai-systems/{id}/context/sources",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {
          "limit": {
            "type": "string"
          },
          "offset": {
            "type": "string"
          },
          "q": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "expected_version": {
            "type": "integer"
          },
          "source": {
            "additionalProperties": false,
            "properties": {
              "case_id": {
                "type": "string"
              },
              "category": {
                "type": "string"
              },
              "id": {
                "type": "string"
              },
              "kind": {
                "type": "string"
              },
              "scope": {
                "type": "string"
              },
              "text": {
                "type": "string"
              },
              "title": {
                "type": "string"
              }
            },
            "required": [
              "id",
              "kind",
              "category",
              "scope",
              "text"
            ],
            "type": "object"
          }
        },
        "required": [
          "expected_version",
          "source"
        ],
        "type": "object"
      },
      "description": "Create or update versioned system understanding, feedback, a golden case or criterion. Read the current context version first and provide expected_version. Preserve user-supplied expected values; do not infer business policy from observed output.",
      "id": "put_context_source",
      "mcp": true,
      "mcp_legacy": false,
      "method": "PUT",
      "path": "/api/ai-systems/{id}/context/sources",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "Upload a text, Markdown, JSON or JSONL document up to 60 KB to system understanding. Provide category and expected_version from get_system_context. Export other document formats to text first.",
      "file_field": "file",
      "form": {
        "additionalProperties": false,
        "properties": {
          "category": {
            "type": "string"
          },
          "expected_version": {
            "type": "integer"
          }
        },
        "type": "object"
      },
      "id": "upload_context_document",
      "max_file_bytes": 60000,
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "multipart": true,
      "path": "/api/ai-systems/{id}/context/upload",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "Seed system context. Uses the same validation and plan limits as Bench.",
      "id": "seed_system_context",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/ai-systems/{id}/context/seed",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "Queue a summary of the system's saved understanding. Poll get_system_context for completion. Does not start a Bench evaluation.",
      "id": "summarize_system_context",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/ai-systems/{id}/context/summarize",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "Delete context source. Uses the same validation and plan limits as Bench.",
      "id": "delete_context_source",
      "mcp": true,
      "mcp_legacy": false,
      "method": "DELETE",
      "path": "/api/ai-systems/{id}/context/sources/{sourceID}",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        },
        "sourceID": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "List context connections. Does not start an evaluation.",
      "id": "list_context_connections",
      "mcp": true,
      "mcp_legacy": false,
      "method": "GET",
      "path": "/api/ai-systems/{id}/context/connections",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "config": {
            "additionalProperties": false,
            "properties": {
              "base_url": {
                "type": "string"
              },
              "dataset_ids": {
                "items": {
                  "type": "string"
                },
                "type": "array"
              },
              "environment": {
                "type": "string"
              },
              "project": {
                "type": "string"
              },
              "prompt_names": {
                "items": {
                  "type": "string"
                },
                "type": "array"
              },
              "provider": {
                "enum": [
                  "langfuse",
                  "langsmith"
                ],
                "type": "string"
              },
              "since": {
                "type": "string"
              }
            },
            "required": [
              "provider",
              "base_url",
              "project",
              "since"
            ],
            "type": "object"
          },
          "content_consent": {
            "type": "boolean"
          },
          "credentials": {
            "additionalProperties": false,
            "properties": {
              "api_key": {
                "type": "string"
              },
              "public_key": {
                "type": "string"
              },
              "secret_key": {
                "type": "string"
              }
            },
            "type": "object"
          },
          "retention_days": {
            "type": "integer"
          }
        },
        "required": [
          "config",
          "credentials",
          "content_consent"
        ],
        "type": "object"
      },
      "description": "Connect a supported evidence provider using explicit content consent and selected project configuration. Store provider credentials only in secrets. Synchronization imports redacted evidence; it does not make that evidence business policy.",
      "id": "create_context_connection",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/ai-systems/{id}/context/connections",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "Sync context connection. Uses the same validation and plan limits as Bench.",
      "id": "sync_context_connection",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/ai-systems/{id}/context/connections/{connectionID}/sync",
      "path_parameters": {
        "connectionID": {
          "minLength": 1,
          "type": "string"
        },
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "Delete context connection. Uses the same validation and plan limits as Bench.",
      "id": "delete_context_connection",
      "mcp": true,
      "mcp_legacy": false,
      "method": "DELETE",
      "path": "/api/ai-systems/{id}/context/connections/{connectionID}",
      "path_parameters": {
        "connectionID": {
          "minLength": 1,
          "type": "string"
        },
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "description": {
            "type": "string"
          },
          "name": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Update system. Uses the same validation and plan limits as Bench.",
      "id": "update_system",
      "mcp": true,
      "mcp_legacy": false,
      "method": "PATCH",
      "path": "/api/ai-systems/{id}",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "key": {
            "type": "string"
          },
          "status": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Resolve finding. Uses the same validation and plan limits as Bench.",
      "id": "resolve_finding",
      "mcp": true,
      "mcp_legacy": false,
      "method": "PUT",
      "path": "/api/ai-systems/{id}/finding-resolution",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "Delete system. Uses the same validation and plan limits as Bench.",
      "id": "delete_system",
      "mcp": true,
      "mcp_legacy": false,
      "method": "DELETE",
      "path": "/api/ai-systems/{id}",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "branch": {
            "type": "string"
          },
          "call_site_id": {
            "type": "string"
          },
          "repo_full_name": {
            "type": "string"
          },
          "role": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Attach a scanned prompt, tool, model configuration or harness to a system. Use the exact repo_full_name, branch and call_site_id returned by a scan. This does not edit source code.",
      "id": "add_system_component",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/ai-systems/{id}/components",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "Remove system component. Uses the same validation and plan limits as Bench.",
      "id": "remove_system_component",
      "mcp": true,
      "mcp_legacy": false,
      "method": "DELETE",
      "path": "/api/ai-systems/{id}/components/{componentID}",
      "path_parameters": {
        "componentID": {
          "minLength": 1,
          "type": "string"
        },
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "account",
      "body": {
        "additionalProperties": false,
        "properties": {
          "enabled": {
            "type": "boolean"
          }
        },
        "type": "object"
      },
      "description": "Set continuous evaluation. Uses the same validation and plan limits as Bench. Requires Bench OAuth account authorization; a scoped API key is insufficient.",
      "id": "set_continuous_evaluation",
      "mcp": true,
      "mcp_legacy": false,
      "method": "PATCH",
      "path": "/api/ai-systems/{id}/components/{componentID}/continuous-eval",
      "path_parameters": {
        "componentID": {
          "minLength": 1,
          "type": "string"
        },
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "edge_type": {
            "type": "string"
          },
          "from_component_id": {
            "type": "integer"
          },
          "to_component_id": {
            "type": "integer"
          }
        },
        "type": "object"
      },
      "description": "Add system connection. Uses the same validation and plan limits as Bench.",
      "id": "add_system_connection",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/ai-systems/{id}/edges",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "Remove system connection. Uses the same validation and plan limits as Bench.",
      "id": "remove_system_connection",
      "mcp": true,
      "mcp_legacy": false,
      "method": "DELETE",
      "path": "/api/ai-systems/{id}/edges/{edgeID}",
      "path_parameters": {
        "edgeID": {
          "minLength": 1,
          "type": "string"
        },
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "Create system run. Uses the same validation and plan limits as Bench.",
      "id": "create_system_run",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/ai-systems/{id}/runs",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "List system runs. Does not start an evaluation.",
      "id": "list_system_runs",
      "mcp": true,
      "mcp_legacy": false,
      "method": "GET",
      "path": "/api/ai-systems/{id}/runs",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "description": "Get system run. Does not start an evaluation.",
      "id": "get_system_run",
      "mcp": true,
      "mcp_legacy": false,
      "method": "GET",
      "path": "/api/ai-systems/{id}/runs/{runID}",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        },
        "runID": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "ai_system_component_id": {
            "type": "integer"
          },
          "evaluation_run_id": {
            "type": "integer"
          }
        },
        "type": "object"
      },
      "description": "Link system run. Uses the same validation and plan limits as Bench.",
      "id": "link_system_run",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/ai-systems/{id}/runs/{runID}/components",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        },
        "runID": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "outcome": {
            "type": "string"
          },
          "outcome_reason": {
            "type": "string"
          },
          "status": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Complete system run. Uses the same validation and plan limits as Bench.",
      "id": "complete_system_run",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/ai-systems/{id}/runs/{runID}/complete",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        },
        "runID": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "Get production health. Does not start an evaluation.",
      "id": "get_production_health",
      "mcp": true,
      "mcp_legacy": false,
      "method": "GET",
      "path": "/api/ai-systems/{id}/production-health",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "description": "Get production feedback. Does not start an evaluation.",
      "id": "get_production_feedback",
      "mcp": true,
      "mcp_legacy": false,
      "method": "GET",
      "path": "/api/ai-systems/{id}/production-feedback",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "account",
      "body": {
        "additionalProperties": false,
        "properties": {
          "auto_bench": {
            "type": "boolean"
          },
          "enabled": {
            "type": "boolean"
          },
          "environment": {
            "type": "string"
          }
        },
        "required": [
          "enabled",
          "environment"
        ],
        "type": "object"
      },
      "description": "Configure production checks and optional automatic investigations for one environment. Enabling automatic evaluations can spend the account allowance; confirm with the user first. Requires Bench OAuth account authorization; a scoped API key is insufficient.",
      "id": "set_production_feedback",
      "mcp": true,
      "mcp_legacy": false,
      "method": "PUT",
      "path": "/api/ai-systems/{id}/production-feedback",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "Production capabilities. Does not start an evaluation.",
      "id": "production_capabilities",
      "mcp": true,
      "mcp_legacy": false,
      "method": "GET",
      "path": "/api/traces/capabilities",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "description": "Sdk status. Does not start an evaluation.",
      "id": "sdk_status",
      "mcp": true,
      "mcp_legacy": false,
      "method": "GET",
      "path": "/api/traces/sdk-status",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {
          "branch": {
            "type": "string"
          },
          "environment": {
            "type": "string"
          },
          "repo_full_name": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "account",
      "description": "Get trace privacy. Does not start an evaluation. Requires Bench OAuth account authorization; a scoped API key is insufficient.",
      "id": "get_trace_privacy",
      "mcp": true,
      "mcp_legacy": false,
      "method": "GET",
      "path": "/api/traces/privacy",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {
          "branch": {
            "type": "string"
          },
          "repo_full_name": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "account",
      "body": {
        "additionalProperties": false,
        "properties": {
          "enabled": {
            "type": "boolean"
          },
          "fields": {
            "items": {
              "type": "string"
            },
            "type": "array"
          }
        },
        "required": [
          "enabled",
          "fields"
        ],
        "type": "object"
      },
      "description": "Set trace privacy. Uses the same validation and plan limits as Bench. Requires Bench OAuth account authorization; a scoped API key is insufficient.",
      "id": "set_trace_privacy",
      "mcp": true,
      "mcp_legacy": false,
      "method": "PUT",
      "path": "/api/traces/privacy",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {
          "branch": {
            "type": "string"
          },
          "repo_full_name": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "Get production check. Does not start an evaluation.",
      "id": "get_production_check",
      "mcp": true,
      "mcp_legacy": true,
      "method": "GET",
      "path": "/api/traces/checks/{jobID}",
      "path_parameters": {
        "jobID": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "description": "Retry production check. Uses the same validation and plan limits as Bench.",
      "id": "retry_production_check",
      "mcp": true,
      "mcp_legacy": true,
      "method": "POST",
      "path": "/api/traces/checks/{jobID}/retry",
      "path_parameters": {
        "jobID": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "branch": {
            "type": "string"
          },
          "capture_content": {
            "type": "boolean"
          },
          "repo_full_name": {
            "type": "string"
          },
          "system_name": {
            "type": "string"
          },
          "traces": {
            "items": {
              "additionalProperties": false,
              "properties": {
                "source": {
                  "type": "string"
                },
                "spans": {
                  "items": {},
                  "type": "array"
                },
                "trace_id": {
                  "type": "string"
                }
              },
              "type": "object"
            },
            "type": "array"
          }
        },
        "type": "object"
      },
      "description": "Upload explicit SDK trace data. Prefer SDK instrumentation for automatic bounds and redaction. Capture content only when the application owner has opted in.",
      "id": "ingest_traces",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/traces",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "List traces. Does not start an evaluation.",
      "id": "list_traces",
      "mcp": true,
      "mcp_legacy": false,
      "method": "GET",
      "path": "/api/traces",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {
          "branch": {
            "type": "string"
          },
          "environment": {
            "type": "string"
          },
          "limit": {
            "type": "string"
          },
          "repo_full_name": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "description": "Get trace. Does not start an evaluation.",
      "id": "get_trace",
      "mcp": true,
      "mcp_legacy": false,
      "method": "GET",
      "path": "/api/traces/{id}",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "description": "Delete trace. Uses the same validation and plan limits as Bench.",
      "id": "delete_trace",
      "mcp": true,
      "mcp_legacy": false,
      "method": "DELETE",
      "path": "/api/traces/{id}",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "ai_system_component_id": {
            "type": "integer"
          },
          "ai_system_id": {
            "type": "integer"
          }
        },
        "type": "object"
      },
      "description": "Link span. Uses the same validation and plan limits as Bench.",
      "id": "link_span",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/traces/{id}/spans/{spanID}/link",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        },
        "spanID": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "Unlink span. Uses the same validation and plan limits as Bench.",
      "id": "unlink_span",
      "mcp": true,
      "mcp_legacy": false,
      "method": "DELETE",
      "path": "/api/traces/{id}/links/{linkID}",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        },
        "linkID": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "component_id": {
            "type": "integer"
          },
          "evidence_scope": {
            "type": "string"
          },
          "no": {
            "type": "string"
          },
          "provider": {
            "type": "string"
          },
          "question": {
            "type": "string"
          },
          "share_with_typesafe": {
            "type": "boolean"
          },
          "yes": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Evaluate span. Uses the same validation and plan limits as Bench.",
      "id": "evaluate_span",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/traces/{id}/spans/{spanID}/evaluate",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        },
        "spanID": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "description": "Get workspace. Does not start an evaluation.",
      "id": "get_workspace",
      "mcp": true,
      "mcp_legacy": false,
      "method": "GET",
      "path": "/api/org",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "name": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Create workspace. Uses the same validation and plan limits as Bench.",
      "id": "create_workspace",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/org",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "credential",
      "body": {
        "additionalProperties": false,
        "properties": {
          "name": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Rename workspace. Uses the same validation and plan limits as Bench.",
      "id": "rename_workspace",
      "mcp": true,
      "mcp_legacy": false,
      "method": "PATCH",
      "path": "/api/org",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "account",
      "body": {
        "additionalProperties": false,
        "properties": {
          "email": {
            "type": "string"
          },
          "role": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Invite workspace member. Uses the same validation and plan limits as Bench. Requires Bench OAuth account authorization; a scoped API key is insufficient.",
      "id": "invite_workspace_member",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/org/invites",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "account",
      "body": {
        "additionalProperties": false,
        "properties": {
          "token": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Accept workspace invite. Uses the same validation and plan limits as Bench. Requires Bench OAuth account authorization; a scoped API key is insufficient.",
      "id": "accept_workspace_invite",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/org/invites/accept",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "account",
      "body": {
        "additionalProperties": false,
        "properties": {
          "role": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Set workspace member role. Uses the same validation and plan limits as Bench. Requires Bench OAuth account authorization; a scoped API key is insufficient.",
      "id": "set_workspace_member_role",
      "mcp": true,
      "mcp_legacy": false,
      "method": "PATCH",
      "path": "/api/org/members/{userID}",
      "path_parameters": {
        "userID": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "account",
      "description": "Remove workspace member. Uses the same validation and plan limits as Bench. Requires Bench OAuth account authorization; a scoped API key is insufficient.",
      "id": "remove_workspace_member",
      "mcp": true,
      "mcp_legacy": false,
      "method": "DELETE",
      "path": "/api/org/members/{userID}",
      "path_parameters": {
        "userID": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "account",
      "body": {
        "additionalProperties": false,
        "properties": {
          "max_evaluations_per_month": {
            "type": "integer"
          },
          "name": {
            "type": "string"
          },
          "org_read": {
            "type": "boolean"
          },
          "repo_allowlist": {
            "items": {
              "type": "string"
            },
            "type": "array"
          }
        },
        "type": "object"
      },
      "description": "Create a scoped automation credential. Returns plaintext only once. Store it in the application's secret environment, never in source, logs or chat replies. OAuth account authorization is required; API keys cannot mint other keys. Requires Bench OAuth account authorization; a scoped API key is insufficient.",
      "id": "create_api_key",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/account/api-keys",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "account",
      "body": {
        "additionalProperties": false,
        "properties": {
          "replace_revoked": {
            "type": "boolean"
          }
        },
        "type": "object"
      },
      "description": "Retrieve the account's reusable SDK setup credential. Never print or commit the returned secret. replace_revoked=true explicitly replaces a revoked setup key. OAuth account authorization is required. Requires Bench OAuth account authorization; a scoped API key is insufficient.",
      "id": "get_setup_key",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/account/api-keys/setup",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "account",
      "description": "List api keys. Does not start an evaluation. Requires Bench OAuth account authorization; a scoped API key is insufficient.",
      "id": "list_api_keys",
      "mcp": true,
      "mcp_legacy": false,
      "method": "GET",
      "path": "/api/account/api-keys",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "account",
      "description": "Revoke api key. Uses the same validation and plan limits as Bench. Requires Bench OAuth account authorization; a scoped API key is insufficient.",
      "id": "revoke_api_key",
      "mcp": true,
      "mcp_legacy": false,
      "method": "DELETE",
      "path": "/api/account/api-keys/{id}",
      "path_parameters": {
        "id": {
          "minLength": 1,
          "type": "string"
        }
      },
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "public",
      "description": "List plans. Does not start an evaluation.",
      "id": "list_plans",
      "mcp": true,
      "mcp_legacy": false,
      "method": "GET",
      "path": "/api/billing/plans",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "description": "Get payment method. Does not start an evaluation.",
      "id": "get_payment_method",
      "mcp": true,
      "mcp_legacy": false,
      "method": "GET",
      "path": "/api/billing/payment-method",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "credential",
      "description": "List invoices. Does not start an evaluation.",
      "id": "list_invoices",
      "mcp": true,
      "mcp_legacy": false,
      "method": "GET",
      "path": "/api/billing/invoices",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": true
    },
    {
      "auth": "account",
      "body": {
        "additionalProperties": false,
        "properties": {
          "price_id": {
            "type": "string"
          },
          "return_path": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Create a Stripe checkout link for a selected plan price. Obtain the user's approval before starting payment. Return the URL for payment and coupon entry; do not handle card details in the agent. Requires Bench OAuth account authorization; a scoped API key is insufficient.",
      "id": "create_checkout",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/billing/checkout-session",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "account",
      "body": {
        "additionalProperties": false,
        "properties": {
          "price_id": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "description": "Change the subscription to the chosen configured price. This can bill immediately. Obtain explicit approval for the price and interval before calling; use get_billing_portal for coupon-aware upgrades. Requires Bench OAuth account authorization; a scoped API key is insufficient.",
      "id": "change_plan",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/billing/change-plan",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "account",
      "description": "Create a Stripe billing or upgrade link. An optional target price_id opens immediate upgrade confirmation with promotion-code entry. Return the URL to the user to review payment. Requires Bench OAuth account authorization; a scoped API key is insufficient.",
      "id": "get_billing_portal",
      "mcp": true,
      "mcp_legacy": false,
      "method": "GET",
      "path": "/api/billing/portal-session",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {
          "price_id": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "account",
      "description": "Cancel renewal of the subscription. This changes billing; require explicit user approval. Organization billing requires an administrator. Requires Bench OAuth account authorization; a scoped API key is insufficient.",
      "id": "cancel_subscription",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/billing/cancel",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    },
    {
      "auth": "account",
      "description": "Reactivate subscription renewal. This changes billing; require explicit user approval. Organization billing requires an administrator. Requires Bench OAuth account authorization; a scoped API key is insufficient.",
      "id": "reactivate_subscription",
      "mcp": true,
      "mcp_legacy": false,
      "method": "POST",
      "path": "/api/billing/reactivate",
      "path_parameters": {},
      "query": {
        "additionalProperties": false,
        "properties": {},
        "type": "object"
      },
      "read_only": false
    }
  ],
  "version": 1
} as const;
export type OperationId = typeof operationCatalog.operations[number]["id"];
